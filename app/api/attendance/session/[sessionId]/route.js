// app/api/attendance/session/[sessionId]/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    // ===== FIX: AWAIT params in Next.js 15 =====
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: 'Session ID is required'
      }, { status: 400 });
    }

    console.log('📖 Fetching session:', sessionId);

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Find the session
    const session = await db.collection('sessions').findOne({ id: sessionId });

    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return NextResponse.json({
        success: false,
        message: 'Session not found or has been deleted'
      }, { status: 404 });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: `This attendance session is ${session.status}. Please contact your lecturer.`
      }, { status: 400 });
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
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

    console.log('✅ Session found:', {
      id: session.id,
      courseCode: session.courseCode,
      courseName: session.courseName,
      status: session.status,
      expiresAt: session.expiresAt
    });

    // Return session data (excluding sensitive fields like lecturer info)
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        courseCode: session.courseCode,
        courseName: session.courseName,
        department: session.department,
        level: session.level,
        expiresAt: session.expiresAt,
        status: session.status,
        location: session.location, // Needed for distance calculation
        maxStudents: session.maxStudents,
        secureToken: session.secureToken // Include token so students can submit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch session details'
    }, { status: 500 });
  }
}