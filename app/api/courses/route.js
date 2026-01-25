// app/api/courses/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// GET - Fetch lecturer's courses
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
    
    // Get only this lecturer's courses
    const courses = await db.collection('courses')
      .find({ lecturerId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      courses: courses.map(c => ({
        ...c,
        id: c._id.toString(),
        _id: undefined
      }))
    });

  } catch (error) {
    console.error('GET courses error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch courses'
    }, { status: 500 });
  }
}

// POST - Create new course
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
    const { courseName, courseCode, defaultDuration } = body;

    if (!courseName || !courseCode) {
      return NextResponse.json({
        success: false,
        message: 'Course name and code are required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Get lecturer details
    const lecturer = await db.collection('lecturers').findOne({ 
      _id: new (require('mongodb')).ObjectId(lecturerId) 
    });

    const newCourse = {
      lecturerId,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      courseName: courseName.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      defaultDuration: defaultDuration || 15,
      createdAt: new Date(),
      isActive: true
    };

    const result = await db.collection('courses').insertOne(newCourse);

    return NextResponse.json({
      success: true,
      course: {
        ...newCourse,
        id: result.insertedId.toString(),
        _id: undefined
      }
    });

  } catch (error) {
    console.error('POST course error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create course'
    }, { status: 500 });
  }
}

// DELETE - Delete a course
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
    const courseId = searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({
        success: false,
        message: 'Course ID required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Delete only if it belongs to this lecturer
    const result = await db.collection('courses').deleteOne({
      _id: new (require('mongodb')).ObjectId(courseId),
      lecturerId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Course not found or unauthorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted'
    });

  } catch (error) {
    console.error('DELETE course error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete course'
    }, { status: 500 });
  }
}