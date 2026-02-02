// app/api/attendance/submit/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Generate device fingerprint from User Agent + IP
function generateDeviceFingerprint(userAgent, ipAddress) {
  const data = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Validate registration number (flexible format)
function validateRegNumber(regNumber) {
  if (!regNumber || regNumber.length < 4) {
    return { valid: false, message: 'Registration number must be at least 4 characters' };
  }
  
  const hasLetter = /[a-zA-Z]/.test(regNumber);
  const hasNumber = /\d/.test(regNumber);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Registration number must contain both letters and numbers' };
  }
  
  // Allow letters, numbers, hyphens, slashes, and underscores
  const validPattern = /^[a-zA-Z0-9\-\/_]+$/;
  if (!validPattern.test(regNumber)) {
    return { valid: false, message: 'Registration number contains invalid characters' };
  }
  
  return { valid: true };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      secureToken,
      fullName,
      regNumber,
      department,
      level,
      latitude,
      longitude,
    } = body;

    console.log('📝 Attendance submission attempt:', { 
      sessionId, 
      fullName, 
      regNumber,
      hasToken: !!secureToken,
      hasLocation: !!(latitude && longitude)
    });

    // ===== 1. VALIDATE REQUIRED FIELDS =====
    if (!sessionId || !fullName || !regNumber || !department || !level) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // ===== 2. VALIDATE REGISTRATION NUMBER (FLEXIBLE) =====
    const regValidation = validateRegNumber(regNumber);
    if (!regValidation.valid) {
      return NextResponse.json({
        success: false,
        message: regValidation.message
      }, { status: 400 });
    }

    // ===== 3. GET DEVICE FINGERPRINT & IP =====
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     'unknown';
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    console.log('🔍 Security check:', {
      ipAddress,
      deviceFingerprint: deviceFingerprint.substring(0, 16) + '...',
      userAgent: userAgent.substring(0, 50) + '...'
    });

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // ===== 4. GET SESSION DETAILS =====
    const session = await db.collection('sessions').findOne({ id: sessionId });

    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return NextResponse.json({
        success: false,
        message: 'Invalid attendance session'
      }, { status: 404 });
    }

    // ===== 5. CHECK IF SESSION IS ACTIVE AND NOT EXPIRED =====
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (session.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'This attendance session is no longer active'
      }, { status: 410 });
    }
    
    if (now > expiresAt) {
      // Auto-expire the session
      await db.collection('sessions').updateOne(
        { id: sessionId },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        success: false,
        message: '⏰ This attendance session has expired'
      }, { status: 410 });
    }

    // ===== 6. CHECK STUDENT CAPACITY LIMIT FIRST =====
    if (session.maxStudents !== null && session.maxStudents !== undefined) {
      const currentCount = await db.collection('attendance_records').countDocuments({
        sessionId,
        status: 'present'
      });

      console.log('👥 Capacity check:', {
        currentCount,
        maxStudents: session.maxStudents,
        hasSpace: currentCount < session.maxStudents
      });

      if (currentCount >= session.maxStudents) {
        console.log('❌ Capacity limit reached:', { 
          maxStudents: session.maxStudents,
          currentCount 
        });
        
        // Auto-mark session as full
        await db.collection('sessions').updateOne(
          { id: sessionId },
          { $set: { status: 'full' } }
        );
        
        return NextResponse.json({
          success: false,
          message: `❌ Attendance is full! Maximum capacity of ${session.maxStudents} students has been reached.`
        }, { status: 403 });
      }
    }

    // ===== 7. CHECK FOR DUPLICATE ATTENDANCE =====
    // Check by regNumber OR deviceFingerprint OR ipAddress
    const existingAttendance = await db.collection('attendance_records').findOne({
      sessionId,
      $or: [
        { regNumber: regNumber.toUpperCase() },
        { deviceFingerprint: deviceFingerprint },
        { ipAddress: ipAddress }
      ]
    });

    if (existingAttendance) {
      console.log('⚠️ Duplicate attendance blocked:', { 
        regNumber, 
        deviceFingerprint: deviceFingerprint.substring(0, 16) + '...',
        ipAddress,
        previousSubmission: {
          regNumber: existingAttendance.regNumber,
          timestamp: existingAttendance.markedAt
        }
      });
      
      // Log duplicate attempt
      await db.collection('security_logs').insertOne({
        type: 'DUPLICATE_ATTEMPT',
        sessionId,
        regNumber,
        ipAddress,
        deviceFingerprint,
        previousSubmission: existingAttendance.regNumber,
        timestamp: new Date()
      });
      
      return NextResponse.json({
        success: false,
        message: '❌ Attendance already recorded! You have already submitted attendance for this session.'
      }, { status: 409 });
    }

    // ===== 8. VERIFY LOCATION (GEOFENCING) - ONLY IF REQUIRED =====
    const shouldRequireLocation = session.location && session.location.latitude && session.location.longitude;
    
    if (shouldRequireLocation) {
      if (!latitude || !longitude) {
        return NextResponse.json({
          success: false,
          message: '📍 Location access is required to mark attendance. Please enable location and try again.'
        }, { status: 400 });
      }

      const distance = calculateDistance(
        session.location.latitude,
        session.location.longitude,
        latitude,
        longitude
      );

      // Default radius: 100 meters
      const allowedRadius = session.location.radiusInMeters || 100;

      console.log('📍 Location verification:', {
        studentLocation: { latitude, longitude },
        lecturerLocation: { 
          lat: session.location.latitude, 
          lon: session.location.longitude 
        },
        distance: Math.round(distance) + 'm',
        allowedRadius: allowedRadius + 'm',
        withinRange: distance <= allowedRadius
      });

      if (distance > allowedRadius) {
        // Log out-of-range attempt
        await db.collection('security_logs').insertOne({
          type: 'OUT_OF_RANGE',
          sessionId,
          regNumber,
          ipAddress,
          deviceFingerprint,
          distance: Math.round(distance),
          allowedRadius,
          studentLocation: { latitude, longitude },
          timestamp: new Date()
        });
        
        return NextResponse.json({
          success: false,
          message: `❌ You must be within ${allowedRadius}m of the classroom to mark attendance. You are currently ${Math.round(distance)}m away.`
        }, { status: 400 });
      }
    }

    // ===== 9. CREATE ATTENDANCE RECORD =====
    const attendanceRecord = {
      sessionId,
      courseCode: session.courseCode,
      courseName: session.courseName,
      studentName: fullName,
      regNumber: regNumber.toUpperCase(),
      department,
      level,
      deviceFingerprint,
      ipAddress,
      userAgent,
      location: {
        latitude: latitude || null,
        longitude: longitude || null
      },
      distanceFromLecturer: shouldRequireLocation ? Math.round(calculateDistance(
        session.location.latitude,
        session.location.longitude,
        latitude,
        longitude
      )) : null,
      markedAt: new Date(),
      status: 'present',
      verified: true
    };

    const insertResult = await db.collection('attendance_records').insertOne(attendanceRecord);

    // ===== 10. UPDATE SESSION STUDENTS ARRAY =====
    await db.collection('sessions').updateOne(
      { id: sessionId },
      {
        $push: {
          students: {
            fullName,
            regNumber: regNumber.toUpperCase(),
            department,
            level,
            timestamp: new Date()
          }
        },
        $inc: { totalPresent: 1 }
      }
    );

    console.log('✅ Attendance recorded successfully:', {
      id: insertResult.insertedId,
      regNumber: regNumber.toUpperCase(),
      distance: shouldRequireLocation ? Math.round(calculateDistance(
        session.location.latitude,
        session.location.longitude,
        latitude,
        longitude
      )) + 'm' : 'No location check',
      timestamp: attendanceRecord.markedAt
    });

    // Check if capacity just reached
    if (session.maxStudents !== null && session.maxStudents !== undefined) {
      const newCount = await db.collection('attendance_records').countDocuments({
        sessionId,
        status: 'present'
      });
      
      if (newCount >= session.maxStudents) {
        await db.collection('sessions').updateOne(
          { id: sessionId },
          { $set: { status: 'full' } }
        );
        console.log('🔒 Session automatically marked as FULL');
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ Attendance marked successfully! 🎉',
      data: {
        studentName: fullName,
        regNumber: regNumber.toUpperCase(),
        markedAt: attendanceRecord.markedAt,
        distance: shouldRequireLocation ? Math.round(calculateDistance(
          session.location.latitude,
          session.location.longitude,
          latitude,
          longitude
        )) : null,
        courseName: session.courseName,
        courseCode: session.courseCode
      }
    });

  } catch (error) {
    console.error('❌ Attendance submission error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: '❌ Duplicate submission detected. You have already marked attendance!'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to submit attendance. Please try again or contact your lecturer.'
    }, { status: 500 });
  }
}