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
    if (!courseName || !courseCode || !department || !level || !lecturerId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique session ID (simpler format)
    const sessionId = Date.now().toString();
    
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (duration * 60 * 1000));
    
    // Generate secure token
    const secureToken = crypto.randomBytes(32).toString('hex');
    
    // CRITICAL FIX: Get the correct base URL and use /attendance/ path
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // ✅ FIXED: Generate attendance link with correct path
    const sessionLink = `${baseUrl}/attendance/${sessionId}`;

    // Create session object
    const session = {
      id: sessionId,
      courseName,
      courseCode,
      department,
      level,
      duration,
      maxStudents: maxStudents || null,
      lecturerId,
      lecturerName,
      lecturerEmail,
      location: location || null,
      secureToken,
      link: sessionLink,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      students: [], // Initialize empty array
      totalPresent: 0
    };

    // Save to MongoDB
    const client = await clientPromise;
    const db = client.db('attendance_system');
    await db.collection('sessions').insertOne(session);

    console.log('✅ Session created in MongoDB:', {
      id: sessionId,
      link: sessionLink,
      courseName,
      duration: `${duration} minutes`,
      expiresAt: expiresAt.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      session: session
    });

  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}