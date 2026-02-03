import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      courseName,
      courseCode,
      department,
      level,
      duration,
      maxStudents,
      lecturerId,
      lecturerName,
      lecturerEmail,
      location
    } = body;

    // Validate required fields
    if (!courseName || !courseCode || !department || !level || !duration || !lecturerId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + duration * 60000);
    
    // Generate secure token
    const secureToken = crypto.randomBytes(32).toString('hex');
    
    // ===== AUTO-DETECT DOMAIN FROM REQUEST =====
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;
    
    const session = {
      id: sessionId,
      lecturerId,
      lecturerName,
      lecturerEmail,
      courseName,
      courseCode,
      department,
      level,
      createdAt: new Date(),
      expiresAt: expiryTime,
      duration,
      maxStudents: maxStudents || null,
      location: location || null,
      secureToken,
      link: `${baseUrl}/attendance/${sessionId}`, // ✅ FIXED: Auto-detects domain
      status: 'active',
      students: [],
      totalPresent: 0
    };

    // Save to MongoDB
    await db.collection('sessions').insertOne(session);

    console.log('✅ Session created in MongoDB:', sessionId);
    console.log('🔗 Generated link:', session.link);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('❌ Create session error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create session'
    }, { status: 500 });
  }
}