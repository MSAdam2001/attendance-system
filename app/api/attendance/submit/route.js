import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, fullName, regNumber, department, level } = body;

    console.log('📝 Attendance submission:', { sessionId, fullName, regNumber });

    // Validate required fields
    if (!sessionId || !fullName || !regNumber || !department || !level) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Get existing sessions from localStorage simulation
    // In real app, this would be MongoDB
    const studentData = {
      fullName,
      regNumber,
      department,
      level,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Attendance recorded:', studentData);

    return NextResponse.json({
      success: true,
      message: 'Attendance submitted successfully',
      data: studentData
    });

  } catch (error) {
    console.error('❌ Attendance submission error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit attendance'
    }, { status: 500 });
  }
}