// app/api/sessions/details/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { sessionId, secureToken } = await request.json();

    if (!sessionId || !secureToken) {
      return NextResponse.json({
        success: false,
        message: 'Missing session information'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const session = await db.collection('sessions').findOne({ id: sessionId });

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Session not found'
      }, { status: 404 });
    }

    // Verify secure token
    if (session.secureToken !== secureToken) {
      return NextResponse.json({
        success: false,
        message: 'Invalid link. Please use the link shared by your lecturer.'
      }, { status: 403 });
    }

    // Check if expired
    const isExpired = new Date() > new Date(session.expiresAt);
    const isActive = session.status === 'active' && !isExpired;

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        courseName: session.courseName,
        courseCode: session.courseCode,
        lecturerName: session.lecturerName,
        department: session.lecturerDepartment,
        expiresAt: session.expiresAt,
        isActive,
        isExpired,
        radiusInMeters: session.location?.radiusInMeters || 100
      }
    });

  } catch (error) {
    console.error('Get session details error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get session details'
    }, { status: 500 });
  }
}