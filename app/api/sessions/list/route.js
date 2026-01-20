import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    const sessions = await db.collection('sessions')
      .find({ lecturerId: decoded.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}