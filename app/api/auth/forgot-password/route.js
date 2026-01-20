import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email } = await request.json();

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

    if (!lecturer) {
      return NextResponse.json({
        success: false,
        message: 'No account found with this email'
      }, { status: 404 });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store reset code with expiry (10 minutes)
    await db.collection('lecturers').updateOne(
      { email: email.toLowerCase().trim() },
      { 
        $set: { 
          resetCode: resetCode,
          resetCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        } 
      }
    );

    console.log('🔑 Reset code for', email, ':', resetCode);

    return NextResponse.json({
      success: true,
      message: 'Reset code sent successfully',
      code: resetCode // In production, send via email instead
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process request'
    }, { status: 500 });
  }
}