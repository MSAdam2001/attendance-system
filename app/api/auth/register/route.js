import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, department, university } = body;

    console.log('📝 Registration attempt for:', email);

    if (!name || !email || !password || !department) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
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
      department: department.trim(),
      university: university?.trim() || 'North West University, Kano',
      createdAt: new Date(),
      lastLogin: null,
      lastLoginMethod: null,
      isActive: true
    };

    console.log('💾 Saving to database...');
    const result = await lecturersCollection.insertOne(newLecturer);

    console.log('✅ Registration successful!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🏢 Department:', department);

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now login.',
      lecturer: {
        id: result.insertedId.toString(),
        name: newLecturer.name,
        email: newLecturer.email,
        department: newLecturer.department
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