import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, provider } = body;

    console.log('🔐 Login attempt for:', email);

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');
    const lecturer = await db.collection('lecturers').findOne({ 
      email: email.toLowerCase().trim() 
    });

    console.log('👤 User found:', lecturer ? 'YES' : 'NO');

    // OAuth login
    if (provider) {
      if (!lecturer) {
        return NextResponse.json({
          success: false,
          message: 'No account found with this email'
        }, { status: 404 });
      }

      const token = jwt.sign(
        { 
          id: lecturer._id.toString(),
          email: lecturer.email,
          name: lecturer.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        success: true,
        token,
        lecturer: {
          id: lecturer._id.toString(),
          name: lecturer.name,
          email: lecturer.email,
          department: lecturer.department
        }
      });
    }

    // Email & Password login
    if (!password) {
      return NextResponse.json({
        success: false,
        message: 'Password is required'
      }, { status: 400 });
    }

    if (!lecturer) {
      console.log('❌ User not found');
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    if (!lecturer.password) {
      return NextResponse.json({
        success: false,
        message: 'This account uses social login'
      }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, lecturer.password);
    console.log('🔑 Password valid:', isValid);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    const token = jwt.sign(
      { 
        id: lecturer._id.toString(),
        email: lecturer.email,
        name: lecturer.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful!');

    return NextResponse.json({
      success: true,
      token,
      lecturer: {
        id: lecturer._id.toString(),
        name: lecturer.name,
        email: lecturer.email,
        department: lecturer.department
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}