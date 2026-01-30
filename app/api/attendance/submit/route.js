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

// Generate device fingerprint from User Agent + IP + Browser Features
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
                     request.headers.get('cf-connecting-ip') || // Cloudflare
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

    // ===== 5. VERIFY SECURE TOKEN (PREVENT LINK SHARING) =====
    if (!secureToken || session.secureToken !== secureToken) {
      console.log('❌ Invalid token attempt:', { 
        provided: secureToken?.substring(0, 10) + '...', 
        expected: session.secureToken?.substring(0, 10) + '...',
        match: secureToken === session.secureToken
      });
      
      // Log suspicious activity
      await db.collection('security_logs').insertOne({
        type: 'INVALID_TOKEN',
        sessionId,
        ipAddress,
        deviceFingerprint,
        attemptedRegNumber: regNumber,
        timestamp: new Date()
      });
      
      return NextResponse.json({
        success: false,
        message: '⚠️ Invalid link! This link can only be used from your lecturer\'s sharing. Student-shared links are blocked for security.'
      }, { status: 403 });
    }

    // ===== 6. CHECK IF SESSION IS ACTIVE AND NOT EXPIRED =====
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (session.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'This attendance session is no longer active'
      }, { status: 400 });
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
      }, { status: 400 });
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
        message: '❌ Attendance already recorded! One submission per device/student only.'
      }, { status: 400 });
    }

    // ===== 8. VERIFY LOCATION (GEOFENCING) =====
    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        message: '📍 Location access is required to mark attendance. Please enable location and try again.'
      }, { status: 400 });
    }

    if (!session.location || !session.location.latitude || !session.location.longitude) {
      return NextResponse.json({
        success: false,
        message: 'Session location not configured by lecturer'
      }, { status: 400 });
    }

    const distance = calculateDistance(
      session.location.latitude,
      session.location.longitude,
      latitude,
      longitude
    );

    // Default radius: 100 meters (adjust as needed)
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

    // ===== 9. CHECK STUDENT CAPACITY LIMIT (NEW FEATURE) =====
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
        
        // Auto-expire the session due to capacity
        await db.collection('sessions').updateOne(
          { id: sessionId },
          { $set: { status: 'full' } }
        );
        
        // Log capacity reached event
        await db.collection('security_logs').insertOne({
          type: 'CAPACITY_REACHED',
          sessionId,
          regNumber,
          ipAddress,
          deviceFingerprint,
          currentCount,
          maxStudents: session.maxStudents,
          timestamp: new Date()
        });
        
        return NextResponse.json({
          success: false,
          message: `❌ Attendance is full! Maximum capacity of ${session.maxStudents} students has been reached.`
        }, { status: 400 });
      }
    }

    // ===== 10. CHECK IF STUDENT CLEARED DATA AND RETRYING =====
    // Check if same device previously submitted with different regNumber
    const sameDeviceDifferentStudent = await db.collection('attendance_records').findOne({
      sessionId,
      deviceFingerprint,
      regNumber: { $ne: regNumber.toUpperCase() }
    });

    if (sameDeviceDifferentStudent) {
      console.log('⚠️ Device reuse detected:', {
        currentRegNumber: regNumber,
        previousRegNumber: sameDeviceDifferentStudent.regNumber,
        deviceFingerprint: deviceFingerprint.substring(0, 16) + '...'
      });
      
      await db.collection('security_logs').insertOne({
        type: 'DEVICE_REUSE',
        sessionId,
        currentRegNumber: regNumber,
        previousRegNumber: sameDeviceDifferentStudent.regNumber,
        deviceFingerprint,
        ipAddress,
        timestamp: new Date()
      });
      
      return NextResponse.json({
        success: false,
        message: '❌ This device was already used to submit attendance. One device per student only.'
      }, { status: 400 });
    }

    // ===== 11. CREATE ATTENDANCE RECORD =====
    const attendanceRecord = {
      sessionId,
      courseCode: session.courseCode,
      courseName: session.courseName,
      studentName: fullName,
      regNumber: regNumber.toUpperCase(), // Standardize to uppercase
      department,
      level,
      deviceFingerprint,
      ipAddress,
      userAgent,
      location: {
        latitude,
        longitude
      },
      distanceFromLecturer: Math.round(distance),
      markedAt: new Date(),
      status: 'present',
      verified: true
    };

    const insertResult = await db.collection('attendance_records').insertOne(attendanceRecord);

    // ===== 12. UPDATE SESSION STUDENTS ARRAY =====
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
      distance: Math.round(distance) + 'm',
      timestamp: attendanceRecord.markedAt
    });

    // Check if capacity just reached after this submission
    if (session.maxStudents !== null && session.maxStudents !== undefined) {
      const newCount = await db.collection('attendance_records').countDocuments({
        sessionId,
        status: 'present'
      });
      
      if (newCount >= session.maxStudents) {
        // Mark session as full
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
        distance: Math.round(distance),
        courseName: session.courseName,
        courseCode: session.courseCode
      }
    });

  } catch (error) {
    console.error('❌ Attendance submission error:', error);

    // Handle MongoDB duplicate key error (additional safety)
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: '❌ Duplicate submission detected. You have already marked attendance!'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to submit attendance. Please try again or contact your lecturer.'
    }, { status: 500 });
  }
}