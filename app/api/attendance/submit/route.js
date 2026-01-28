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

    console.log('📝 Attendance submission:', { sessionId, fullName, regNumber });

    // Validate required fields
    if (!sessionId || !fullName || !regNumber || !department || !level) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Get device fingerprint
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // 1. Get session details
    const session = await db.collection('sessions').findOne({ id: sessionId });

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Invalid attendance session'
      }, { status: 404 });
    }

    // 2. Verify secure token (prevent student link sharing)
    if (!secureToken || session.secureToken !== secureToken) {
      console.log('❌ Invalid token attempt:', { 
        provided: secureToken, 
        expected: session.secureToken 
      });
      return NextResponse.json({
        success: false,
        message: '⚠️ Invalid link! Please use the link shared by your lecturer only.'
      }, { status: 403 });
    }

    // 3. Check if session is active and not expired
    if (session.status !== 'active' || new Date() > new Date(session.expiresAt)) {
      return NextResponse.json({
        success: false,
        message: 'This attendance session has expired'
      }, { status: 400 });
    }

    // 4. Check for duplicate attendance (by regNumber OR deviceFingerprint)
    const existingAttendance = await db.collection('attendance_records').findOne({
      sessionId,
      $or: [
        { regNumber: regNumber },
        { deviceFingerprint: deviceFingerprint }
      ]
    });

    if (existingAttendance) {
      console.log('⚠️ Duplicate attendance attempt:', { 
        regNumber, 
        deviceFingerprint,
        existingRecord: existingAttendance.regNumber
      });
      return NextResponse.json({
        success: false,
        message: '❌ You have already marked attendance for this session!'
      }, { status: 400 });
    }

    // 5. Verify location (distance check)
    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        message: '📍 Location access is required to mark attendance'
      }, { status: 400 });
    }

    if (!session.location || !session.location.latitude || !session.location.longitude) {
      return NextResponse.json({
        success: false,
        message: 'Session location not set by lecturer'
      }, { status: 400 });
    }

    const distance = calculateDistance(
      session.location.latitude,
      session.location.longitude,
      latitude,
      longitude
    );

    const allowedRadius = session.location.radiusInMeters || 100;

    console.log('📍 Distance check:', {
      studentLocation: { latitude, longitude },
      lecturerLocation: { 
        lat: session.location.latitude, 
        lon: session.location.longitude 
      },
      distance: Math.round(distance),
      allowedRadius
    });

    if (distance > allowedRadius) {
      return NextResponse.json({
        success: false,
        message: `❌ You must be within ${allowedRadius} meters of the classroom. You are ${Math.round(distance)} meters away.`
      }, { status: 400 });
    }

    // 6. Create attendance record
    const attendanceRecord = {
      sessionId,
      courseCode: session.courseCode,
      courseName: session.courseName,
      studentName: fullName,
      regNumber,
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
      status: 'present'
    };

    await db.collection('attendance_records').insertOne(attendanceRecord);

    // 7. Update session students array
    await db.collection('sessions').updateOne(
      { id: sessionId },
      {
        $push: {
          students: {
            fullName,
            regNumber,
            department,
            level,
            timestamp: new Date()
          }
        }
      }
    );

    console.log('✅ Attendance recorded:', {
      regNumber,
      distance: Math.round(distance),
      timestamp: attendanceRecord.markedAt
    });

    return NextResponse.json({
      success: true,
      message: '✅ Attendance marked successfully! 🎉',
      data: {
        studentName: fullName,
        regNumber,
        markedAt: attendanceRecord.markedAt,
        distance: Math.round(distance)
      }
    });

  } catch (error) {
    console.error('❌ Attendance submission error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: '❌ You have already marked attendance for this session!'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to submit attendance. Please try again.'
    }, { status: 500 });
  }
}