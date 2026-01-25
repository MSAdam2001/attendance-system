"use client"

import { useState, useEffect } from 'react';

export default function SimpleAnalytics() {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [lecturer, setLecturer] = useState(null);

  useEffect(() => {
    const lecturerData = localStorage.getItem('lecturer');
    const token = localStorage.getItem('token');
    
    if (!lecturerData || !token) {
      window.location.href = '/login';
      return;
    }

    const parsedLecturer = JSON.parse(lecturerData);
    setLecturer(parsedLecturer);

    const allSessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
    const lecturerSessions = allSessions.filter(s => s.lecturerId === parsedLecturer.id);
    setSessions(lecturerSessions);

    const studentMap = new Map();
    lecturerSessions.forEach(session => {
      session.students?.forEach(student => {
        if (!studentMap.has(student.regNumber)) {
          studentMap.set(student.regNumber, {
            regNumber: student.regNumber,
            fullName: student.fullName,
            department: student.department,
            level: student.level || '100 Level',
            attended: [],
            total: 0
          });
        }
        studentMap.get(student.regNumber).attended.push({
          date: new Date(student.timestamp).toLocaleDateString(),
          time: new Date(student.timestamp).toLocaleTimeString()
        });
        studentMap.get(student.regNumber).total += 1;
      });
    });

    const studentList = Array.from(studentMap.values()).map(student => ({
      ...student,
      missed: lecturerSessions.length - student.total,
      totalSessions: lecturerSessions.length,
      percentage: lecturerSessions.length > 0 ? ((student.total / lecturerSessions.length) * 100).toFixed(1) : 0
    })).sort((a, b) => b.percentage - a.percentage);

    setStudents(studentList);
  }, []);

  const getStatus = (percentage) => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 50) return 'Good';
    return 'Poor';
  };

  const exportToExcel = () => {
    // Create proper Excel-formatted CSV
    const rows = [
      // Header Information (spanning across columns for better visibility)
      ['SEMESTER ATTENDANCE REPORT', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Generated:', new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), '', '', '', '', '', '', ''],
      ['Lecturer:', lecturer?.name || '', '', '', '', '', '', '', ''],
      ['Department:', lecturer?.department || '', '', '', '', '', '', '', ''],
      ['Total Students:', students.length, '', '', '', '', '', '', ''],
      ['Total Sessions:', sessions.length, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      // Column Headers
      ['Reg Number', 'Full Name', 'Department', 'Level', 'Attended', 'Missed', 'Total', 'Percentage', 'Status'],
      // Student Data
      ...students.map(student => [
        student.regNumber,
        student.fullName,
        student.department,
        student.level,
        student.total,
        student.missed,
        student.totalSessions,
        `${student.percentage}%`,
        getStatus(parseFloat(student.percentage))
      ])
    ];

    // Convert to CSV with proper formatting
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Handle cells that might contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Add BOM for proper Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!lecturer) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">📊 Attendance Report</h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 break-words">
                Lecturer: {lecturer.name} • {lecturer.department}
              </p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-gray-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                📥 <span className="hidden xs:inline">Export to</span> Excel
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-blue-50 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold">Total Students</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-1 sm:mt-2">{students.length}</p>
            </div>
            <div className="bg-purple-50 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold">Total Sessions</p>
              <p className="text-3xl sm:text-4xl font-bold text-purple-600 mt-1 sm:mt-2">{sessions.length}</p>
            </div>
            <div className="bg-green-50 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold">Average Attendance</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-1 sm:mt-2">
                {students.length > 0 ? (students.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / students.length).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Student Cards */}
          {students.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-gray-500 text-base sm:text-lg">No attendance data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {students.map((student, idx) => (
                <div 
                  key={idx} 
                  className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-4">
                    {/* Student Info Section */}
                    <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-4">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Registration Number</p>
                        <p className="text-base sm:text-lg font-mono font-bold text-blue-600 break-all">{student.regNumber}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Full Name</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{student.fullName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Department</p>
                          <p className="text-xs sm:text-sm text-gray-700 font-medium break-words">{student.department}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Level</p>
                          <p className="text-xs sm:text-sm text-gray-700 font-medium">{student.level}</p>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="lg:col-span-3">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                        <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center border border-green-200">
                          <p className="text-xs text-green-700 font-semibold mb-1">Attended</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">{student.total}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 sm:p-3 text-center border border-red-200">
                          <p className="text-xs text-red-700 font-semibold mb-1">Missed</p>
                          <p className="text-xl sm:text-2xl font-bold text-red-600">{student.missed}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center border border-blue-200">
                          <p className="text-xs text-blue-700 font-semibold mb-1">Total</p>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{student.totalSessions}</p>
                        </div>
                      </div>
                      
                      {/* Performance Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs text-purple-700 font-semibold mb-2">Attendance Rate</p>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl sm:text-3xl font-bold text-purple-700">{student.percentage}%</p>
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center ${
                              student.percentage >= 75 ? 'bg-green-500' :
                              student.percentage >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}>
                              <span className="text-white text-xl sm:text-2xl font-bold">
                                {student.percentage >= 75 ? '✓' : student.percentage >= 50 ? '○' : '✕'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 border border-indigo-200">
                          <p className="text-xs text-indigo-700 font-semibold mb-2">Status</p>
                          <div className="flex items-center justify-center h-12 sm:h-14 lg:h-16">
                            <span className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold shadow-md ${
                              student.percentage >= 75 ? 'bg-green-500 text-white' :
                              student.percentage >= 50 ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {getStatus(parseFloat(student.percentage))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}