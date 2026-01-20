// app/api/test/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    const client = await clientPromise;
    const db = client.db('attendance_system');
    
    // Test connection with ping
    await db.command({ ping: 1 });
    console.log('✅ MongoDB ping successful');
    
    // Get database statistics
    const stats = await db.stats();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    // Count documents in lecturers collection
    const lecturersCount = await db.collection('lecturers').countDocuments();
    
    return NextResponse.json({
      success: true,
      message: '✅ MongoDB Connected Successfully!',
      database: 'attendance_system',
      stats: {
        collections: stats.collections,
        dataSize: `${(stats.dataSize / 1024).toFixed(2)} KB`,
        storageSize: `${(stats.storageSize / 1024).toFixed(2)} KB`,
        indexes: stats.indexes,
        indexSize: `${(stats.indexSize / 1024).toFixed(2)} KB`
      },
      collectionsFound: collections.map(c => ({
        name: c.name,
        type: c.type
      })),
      lecturersCount: lecturersCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ MongoDB Test Error:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ MongoDB Connection Failed',
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}