// app/api/setup/create-indexes/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('attendance_system');

    // Create unique compound indexes to prevent duplicate attendance
    await db.collection('attendance_records').createIndex(
      { sessionId: 1, regNumber: 1 }, 
      { unique: true }
    );

    await db.collection('attendance_records').createIndex(
      { sessionId: 1, deviceFingerprint: 1 }, 
      { unique: true }
    );

    console.log('✅ Database indexes created successfully');

    return NextResponse.json({
      success: true,
      message: 'Database indexes created successfully',
      indexes: [
        'sessionId + regNumber (unique)',
        'sessionId + deviceFingerprint (unique)'
      ]
    });

  } catch (error) {
    console.error('❌ Index creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create indexes',
      error: error.message
    }, { status: 500 });
  }
}