import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    const client = await clientPromise;
    const db = client.db('attendance_system');
    
    const lecturer = await db.collection('lecturers').findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!lecturer) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request'
      }, { status: 404 });
    }

    // Check if code matches and not expired
    if (lecturer.resetCode !== code) {
      return NextResponse.json({
        success: false,
        message: 'Invalid reset code'
      }, { status: 400 });
    }

    if (new Date() > new Date(lecturer.resetCodeExpiry)) {
      return NextResponse.json({
        success: false,
        message: 'Reset code has expired'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({
      success: false,
      message: 'Verification failed'
    }, { status: 500 });
  }
}