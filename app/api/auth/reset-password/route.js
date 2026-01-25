import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');
    
    const resetRecord = await db.collection('password_resets').findOne({
      email: email.toLowerCase().trim(),
      code: code.trim(),
      used: false
    });

    if (!resetRecord) {
      return NextResponse.json({
        success: false,
        message: 'Invalid reset code'
      }, { status: 400 });
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json({
        success: false,
        message: 'Reset code has expired'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection('lecturers').updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { password: hashedPassword } }
    );

    // Mark code as used
    await db.collection('password_resets').updateOne(
      { email: email.toLowerCase().trim(), code: code.trim() },
      { $set: { used: true } }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      success: false,
      message: 'Password reset failed'
    }, { status: 500 });
  }
}