import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');
    
    const lecturer = await db.collection('lecturers').findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!lecturer || lecturer.resetCode !== code) {
      return NextResponse.json({
        success: false,
        message: 'Invalid reset request'
      }, { status: 400 });
    }

    if (new Date() > new Date(lecturer.resetCodeExpiry)) {
      return NextResponse.json({
        success: false,
        message: 'Reset code has expired'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    await db.collection('lecturers').updateOne(
      { email: email.toLowerCase().trim() },
      { 
        $set: { password: hashedPassword },
        $unset: { resetCode: '', resetCodeExpiry: '' }
      }
    );

    console.log('✅ Password reset successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to reset password'
    }, { status: 500 });
  }
}