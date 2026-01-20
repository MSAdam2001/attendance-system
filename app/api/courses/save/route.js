import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const { courseName, courseCode, defaultDuration } = await request.json();

    if (!courseName || !courseCode) {
      return NextResponse.json(
        { success: false, message: 'Course name and code are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const course = {
      id: Date.now().toString(),
      lecturerId: decoded.id,
      courseName,
      courseCode,
      defaultDuration: defaultDuration || 15,
      createdAt: new Date()
    };

    await db.collection('courses').insertOne(course);

    return NextResponse.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Save course error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const client = await clientPromise;
    const db = client.db('attendance_system');

    const courses = await db.collection('courses')
      .find({ lecturerId: decoded.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      courses
    });

  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}