// app/api/attendance/session/[sessionId]/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;

    console.log('📝 Fetching session:', sessionId);

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Get session from MongoDB
    const session = await db.collection('sessions').findOne({ id: sessionId });

    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return NextResponse.json({
        success: false,
        message: 'Session not found or has been deleted'
      }, { status: 404 });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (now > expiresAt && session.status === 'active') {
      // Auto-expire the session
      await db.collection('sessions').updateOne(
        { id: sessionId },
        { $set: { status: 'expired' } }
      );
      session.status = 'expired';
    }

    // Get attendance count
    const attendanceCount = await db.collection('attendance_records').countDocuments({
      sessionId,
      status: 'present'
    });

    console.log('✅ Session found:', {
      id: sessionId,
      courseName: session.courseName,
      status: session.status,
      attendanceCount
    });

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        currentAttendance: attendanceCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch session'
    }, { status: 500 });
  }
}