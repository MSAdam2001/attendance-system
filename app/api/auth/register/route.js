import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, faculty, department, university, oauthProvider } = body;

    console.log('📝 Registration attempt for:', email);

    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and password are required'
      }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Name must be at least 3 characters long'
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');
    const lecturersCollection = db.collection('lecturers');

    const existingLecturer = await lecturersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingLecturer) {
      console.log('❌ Email already registered:', email);
      return NextResponse.json({
        success: false,
        message: 'This email is already registered. Please login instead.'
      }, { status: 409 });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newLecturer = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      faculty: faculty?.trim() || 'Not specified',
      department: department?.trim() || 'Not specified',
      university: university?.trim() || 'North West University, Kano',
      oauthProvider: oauthProvider || null,
      createdAt: new Date(),
      lastLogin: new Date(), // Set initial login time
      lastLoginMethod: oauthProvider || 'email',
      isActive: true
    };

    console.log('💾 Saving to database...');
    const result = await lecturersCollection.insertOne(newLecturer);

    // Generate JWT token for auto-login
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        id: result.insertedId.toString(),
        email: newLecturer.email,
        name: newLecturer.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🏢 Faculty:', faculty);
    console.log('📚 Department:', department);
    console.log('🔑 Token generated for auto-login');

    // Return token and lecturer data for auto-login
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Redirecting to dashboard...',
      token: token, // Token for auto-login
      lecturer: {
        id: result.insertedId.toString(),
        name: newLecturer.name,
        email: newLecturer.email,
        faculty: newLecturer.faculty,
        department: newLecturer.department,
        university: newLecturer.university
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}