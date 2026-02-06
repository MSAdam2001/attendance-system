// app/api/lecturer/sessions/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get('lecturerId');
    
    if (!lecturerId) {
      return NextResponse.json({
        success: false,
        message: 'Lecturer ID required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('attendance_system');

    // ✅ FETCH SESSIONS WITH ATTENDANCE COUNTS
    const sessions = await db.collection('sessions')
      .find({ lecturerId })
      .sort({ createdAt: -1 })
      .toArray();

    // ✅ ENRICH SESSIONS WITH STUDENT DATA FROM attendance_records
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        // Get actual student records
        const students = await db.collection('attendance_records')
          .find({ 
            sessionId: session.id,
            status: 'present'
          })
          .sort({ markedAt: -1 })
          .toArray();

        return {
          ...session,
          students: students.map(s => ({
            fullName: s.studentName,
            regNumber: s.regNumber,
            department: s.department,
            level: s.level,
            timestamp: s.markedAt
          })),
          totalPresent: students.length
        };
      })
    );

    console.log(`✅ Fetched ${enrichedSessions.length} sessions for lecturer ${lecturerId}`);

    return NextResponse.json({
      success: true,
      sessions: enrichedSessions
    });

  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}