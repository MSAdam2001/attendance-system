'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type declarations for jspdf and jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
    internal: {
      pageSize: {
        width: number;
        height: number;
        getWidth: () => number;
        getHeight: () => number;
      };
      getNumberOfPages: () => number;
    };
  }
}


export default function ViewAttendance() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('time');

  useEffect(() => {
    const lecturerData = localStorage.getItem('lecturer');
    if (!lecturerData) {
      router.push('/login');
      return;
    }
    loadSession();
    setLoading(false);
    const interval = setInterval(() => { loadSession(); }, 3000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  const loadSession = () => {
    const savedSessions = localStorage.getItem('attendanceSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const foundSession = sessions.find(s => s.id === params.id);
      if (foundSession) {
        setSession(foundSession);
      } else {
        alert('Session not found');
        router.push('/dashboard');
      }
    }
  };

  const filteredStudents = session?.students?.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'regNumber') return a.regNumber.localeCompare(b.regNumber);
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Export to Excel
  const exportToExcel = () => {
    if (!session || !session.students || session.students.length === 0) {
      alert('⚠️ No students to export');
      return;
    }

    const data = session.students.map((student, index) => ({
      '#': index + 1,
      'Full Name': student.fullName,
      'Registration Number': student.regNumber,
      'Department': student.department,
      'Level': student.level,
      'Time Submitted': new Date(student.timestamp).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    // Add metadata sheet
    const metadata = [
      ['Course Name', session.courseName],
      ['Course Code', session.courseCode],
      ['Date', new Date(session.createdAt).toLocaleDateString()],
      ['Total Students', session.students.length],
      ['Duration', `${session.duration} minutes`]
    ];
    const metaSheet = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Session Info');

    XLSX.writeFile(workbook, `${session.courseCode}_Attendance_${new Date().toLocaleDateString()}.xlsx`);
    alert('✅ Excel file downloaded successfully!');
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!session || !session.students || session.students.length === 0) {
      alert('⚠️ No students to export');
      return;
    }

    const doc = new jsPDF();
    
    // Add university header
    doc.setFontSize(20);
    doc.setTextColor(40, 116, 240);
    doc.text('North West University, Kano', 105, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Attendance Report', 105, 25, { align: 'center' });
    
    // Add session info
    doc.setFontSize(11);
    doc.text(`Course: ${session.courseName}`, 14, 35);
    doc.text(`Code: ${session.courseCode}`, 14, 42);
    doc.text(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 14, 49);
    doc.text(`Total Present: ${session.students.length}`, 14, 56);
    
    // Add table
    const tableData = session.students.map((student, index) => [
      index + 1,
      student.fullName,
      student.regNumber,
      student.department,
      student.level,
      new Date(student.timestamp).toLocaleTimeString()
    ]);

    doc.autoTable({
      startY: 65,
      head: [['#', 'Full Name', 'Reg Number', 'Department', 'Level', 'Time']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 116, 240] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15 },
        5: { cellWidth: 30 }
      }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`${session.courseCode}_Attendance_${new Date().toLocaleDateString()}.pdf`);
    alert('✅ PDF downloaded successfully!');
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!session || !session.students || session.students.length === 0) {
      alert('⚠️ No students to export');
      return;
    }

    const headers = ['#', 'Full Name', 'Registration Number', 'Department', 'Level', 'Time Submitted'];
    const rows = session.students.map((student, index) => [
      index + 1,
      student.fullName,
      student.regNumber,
      student.department,
      student.level,
      new Date(student.timestamp).toLocaleString()
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.courseCode}_Attendance_${new Date().toLocaleDateString()}.csv`;
    a.click();
    alert('✅ CSV downloaded successfully!');
  };

  const printAttendance = () => { window.print(); };

  const getSessionStatus = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = expiry - now;
    const minutesLeft = Math.floor(timeLeft / 60000);
    if (timeLeft <= 0) return { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: '🔒' };
    if (minutesLeft <= 2) return { label: 'Ending Soon', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' };
    return { label: 'Active', color: 'bg-green-100 text-green-700', icon: '✅' };
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = expiry - now;
    const minutesLeft = Math.floor(timeLeft / 60000);
    const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
    if (timeLeft <= 0) return 'Session Expired';
    if (minutesLeft < 1) return `${secondsLeft} seconds left`;
    return `${minutesLeft}m ${secondsLeft}s remaining`;
  };

  const copyAttendanceLink = () => {
    navigator.clipboard.writeText(session.link);
    alert('✅ Attendance link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const status = getSessionStatus(session.expiresAt);
  const isActive = status.label !== 'Expired';
  const attendanceRate = session.students?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-flex items-center gap-1 print:hidden">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{session.courseName}</h1>
              <p className="text-gray-600">Course Code: {session.courseCode}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${status.color} print:hidden`}>
              {status.icon} {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isActive && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg mb-6 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Session Active</p>
                  <p className="text-sm text-blue-100">{getTimeRemaining(session.expiresAt)}</p>
                </div>
              </div>
              <button onClick={copyAttendanceLink} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Students Present</p>
                <p className="text-4xl font-bold mt-1">{attendanceRate}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Status</p>
            <p className={`text-2xl font-bold mt-1 ${status.label === 'Active' ? 'text-green-600' : status.label === 'Ending Soon' ? 'text-yellow-600' : 'text-gray-600'}`}>
              {status.label}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Created</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">
              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-100">
            <p className="text-gray-500 text-sm font-medium">Duration</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">{session.duration} min</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Students Present</h2>
                <p className="text-sm text-gray-500 mt-1 print:hidden">Auto-refreshing every 3 seconds</p>
              </div>
              
              <div className="flex flex-wrap gap-3 print:hidden">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="time">Sort by Time</option>
                  <option value="name">Sort by Name</option>
                  <option value="regNumber">Sort by Reg Number</option>
                </select>

                <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>

                <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>

                <button onClick={exportToCSV} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>

                <button onClick={printAttendance} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>

          {sortedStudents.length === 0 ? (
            <div className="p-12 text-center">
              {searchTerm ? (
                <>
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No students found matching "{searchTerm}"</p>
                  <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No students yet</h3>
                  <p className="text-gray-500 mb-4">Waiting for students to submit their attendance...</p>
                  {isActive && (
                    <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                      <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></div>
                      Session is active
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b print:bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">{student.regNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{student.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{student.level} Level</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="print:hidden">
                          {formatDistanceToNow(new Date(student.timestamp), { addSuffix: true })}
                        </span>
                        <span className="hidden print:inline">
                          {new Date(student.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hidden print:block mt-8 pt-8 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Generated on {new Date().toLocaleString()} • North West University, Kano
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:inline {
            display: inline !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:hover\\:bg-white:hover {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}