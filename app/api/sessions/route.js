// app/api/sessions/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// GET - Fetch lecturer's sessions
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const lecturerId = decoded.id;

    const client = await clientPromise;
    const db = client.db('attendance_system');
    
    // Get only this lecturer's sessions
    const sessions = await db.collection('sessions')
      .find({ lecturerId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        ...s,
        id: s._id.toString(),
        _id: undefined
      }))
    });

  } catch (error) {
    console.error('GET sessions error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

// POST - Create new session
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const lecturerId = decoded.id;

    const body = await request.json();
    const { courseName, courseCode, duration } = body;

    if (!courseName || !courseCode || !duration) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Get lecturer details
    const lecturer = await db.collection('lecturers').findOne({ 
      _id: new (require('mongodb')).ObjectId(lecturerId) 
    });

    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + duration * 60000);

    const newSession = {
      id: sessionId,
      lecturerId,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      lecturerDepartment: lecturer.department,
      courseName,
      courseCode,
      duration,
      createdAt: new Date(),
      expiresAt: expiryTime,
      status: 'active',
      students: [],
      link: `${process.env.NEXT_PUBLIC_BASE_URL}/attendance/${sessionId}`
    };

    await db.collection('sessions').insertOne(newSession);

    return NextResponse.json({
      success: true,
      session: {
        ...newSession,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('POST session error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create session'
    }, { status: 500 });
  }
}

// DELETE - Delete a session
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const lecturerId = decoded.id;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: 'Session ID required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Delete only if it belongs to this lecturer
    const result = await db.collection('sessions').deleteOne({
      id: sessionId,
      lecturerId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Session not found or unauthorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted'
    });

  } catch (error) {
    console.error('DELETE session error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete session'
    }, { status: 500 });
  }
}