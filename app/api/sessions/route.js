// app/api/sessions/route.js (Update the POST method)
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ... Keep existing GET and DELETE methods ...

// POST - Create new session (UPDATED)
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
    const { 
      courseName, 
      courseCode, 
      duration, 
      latitude, 
      longitude, 
      radiusInMeters 
    } = body;

    if (!courseName || !courseCode || !duration) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        message: 'Location is required to create session'
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

    // Generate secure token (prevents student link sharing)
    const secureToken = crypto.randomBytes(32).toString('hex');
    
    // Generate 6-digit session PIN
    const sessionPin = Math.floor(100000 + Math.random() * 900000).toString();

    const newSession = {
      id: sessionId,
      lecturerId,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      lecturerDepartment: lecturer.department,
      courseName,
      courseCode,
      duration,
      sessionPin,
      secureToken, // 🔐 Security token
      location: {
        latitude,
        longitude,
        radiusInMeters: radiusInMeters || 100 // Default 100 meters
      },
      createdAt: new Date(),
      expiresAt: expiryTime,
      status: 'active',
      students: [],
      link: `${process.env.NEXT_PUBLIC_BASE_URL}/attendance/${sessionId}?token=${secureToken}`
    };

    await db.collection('sessions').insertOne(newSession);

    console.log('✅ Session created:', {
      sessionId,
      pin: sessionPin,
      radius: newSession.location.radiusInMeters,
      expiresAt: expiryTime
    });

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