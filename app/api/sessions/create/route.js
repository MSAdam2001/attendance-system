// app/api/sessions/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseName, courseCode, duration } = body;

    if (!courseName || !courseCode || !duration) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + duration * 60000);
    
    const session = {
      id: sessionId,
      courseName,
      courseCode,
      lecturerId: decoded.id,
      createdAt: new Date(),
      expiresAt: expiryTime,
      duration,
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/attendance/${sessionId}`,
      status: 'active',
      students: []
    };

    await db.collection('sessions').insertOne(session);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}