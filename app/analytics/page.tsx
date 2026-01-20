"use client";

import React, { useState, useEffect } from 'react';
import { Download, Search, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

export default function AttendanceAnalytics() {
  const [sessions, setSessions] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('percentage');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedSessions = localStorage.getItem('attendanceSessions');
    if (savedSessions) {
      const allSessions = JSON.parse(savedSessions);
      setSessions(allSessions);
      calculateStudentStats(allSessions);
    }
  };

  const calculateStudentStats = (allSessions) => {
    const studentMap = new Map();
    const totalSessions = allSessions.length;

    allSessions.forEach(session => {
      session.students?.forEach(student => {
        const key = student.regNumber;
        
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            regNumber: student.regNumber,
            fullName: student.fullName,
            department: student.department,
            level: student.level,
            attendedSessions: 0,
            missedSessions: 0,
            totalSessions: totalSessions,
            sessionDetails: []
          });
        }

        const studentData = studentMap.get(key);
        studentData.attendedSessions += 1;
        studentData.sessionDetails.push({
          courseName: session.courseName,
          courseCode: session.courseCode,
          date: session.createdAt,
          timestamp: student.timestamp
        });
      });
    });

    // Calculate missed sessions
    studentMap.forEach((student, key) => {
      student.missedSessions = totalSessions - student.attendedSessions;
      student.percentage = totalSessions > 0 
        ? ((student.attendedSessions / totalSessions) * 100).toFixed(1)
        : 0;
      
      // Determine status
      if (student.percentage >= 75) {
        student.status = 'Excellent';
        student.statusColor = 'text-green-600 bg-green-100';
      } else if (student.percentage >= 50) {
        student.status = 'Good';
        student.statusColor = 'text-blue-600 bg-blue-100';
      } else if (student.percentage >= 30) {
        student.status = 'Poor';
        student.statusColor = 'text-yellow-600 bg-yellow-100';
      } else {
        student.status = 'Critical';
        student.statusColor = 'text-red-600 bg-red-100';
      }
    });

    const stats = Array.from(studentMap.values());
    setStudentStats(stats);
  };

  const filteredStudents = studentStats
    .filter(student => {
      const matchesSearch = 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'excellent') return matchesSearch && student.percentage >= 75;
      if (filterBy === 'good') return matchesSearch && student.percentage >= 50 && student.percentage < 75;
      if (filterBy === 'poor') return matchesSearch && student.percentage >= 30 && student.percentage < 50;
      if (filterBy === 'critical') return matchesSearch && student.percentage < 30;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'percentage') return parseFloat(b.percentage) - parseFloat(a.percentage);
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'regNumber') return a.regNumber.localeCompare(b.regNumber);
      if (sortBy === 'department') return a.department.localeCompare(b.department);
      return 0;
    });

  const exportToCSV = () => {
    const headers = ['Reg Number', 'Full Name', 'Department', 'Level', 'Attended', 'Missed', 'Total', 'Percentage', 'Status'];
    const rows = filteredStudents.map(student => [
      student.regNumber,
      student.fullName,
      student.department,
      student.level,
      student.attendedSessions,
      student.missedSessions,
      student.totalSessions,
      `${student.percentage}%`,
      student.status
    ]);

    const csvContent = [
      'Semester Attendance Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Students: ${filteredStudents.length}`,
      `Total Sessions: ${sessions.length}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Semester_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const overallStats = {
    totalStudents: studentStats.length,
    totalSessions: sessions.length,
    averageAttendance: studentStats.length > 0
      ? (studentStats.reduce((acc, s) => acc + parseFloat(s.percentage), 0) / studentStats.length).toFixed(1)
      : 0,
    excellentCount: studentStats.filter(s => s.percentage >= 75).length,
    goodCount: studentStats.filter(s => s.percentage >= 50 && s.percentage < 75).length,
    poorCount: studentStats.filter(s => s.percentage >= 30 && s.percentage < 50).length,
    criticalCount: studentStats.filter(s => s.percentage < 30).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">📊 Attendance Analytics</h1>
              <p className="text-gray-600 mt-2">Semester Performance Report</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                ← Back
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredStudents.length === 0}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{overallStats.totalStudents}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{overallStats.totalSessions}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-medium">Average Attendance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{overallStats.averageAttendance}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm font-medium">At Risk Students</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{overallStats.criticalCount + overallStats.poorCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">Excellent (≥75%)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{overallStats.excellentCount}</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Good (50-74%)</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{overallStats.goodCount}</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-gray-700">Poor (30-49%)</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{overallStats.poorCount}</p>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-gray-700">Critical (&lt;30%)</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{overallStats.criticalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, reg number, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Students</option>
                <option value="excellent">Excellent (≥75%)</option>
                <option value="good">Good (50-74%)</option>
                <option value="poor">Poor (30-49%)</option>
                <option value="critical">Critical (&lt;30%)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="percentage">Sort by Percentage</option>
                <option value="name">Sort by Name</option>
                <option value="regNumber">Sort by Reg Number</option>
                <option value="department">Sort by Department</option>
              </select>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No student records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Reg Number</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Full Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Level</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Attended</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Missed</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Percentage</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.regNumber} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-4 py-4 text-sm font-mono font-bold text-gray-900">{student.regNumber}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{student.fullName}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{student.department}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{student.level}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                            {student.attendedSessions}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                            {student.missedSessions}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                          {student.totalSessions}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold" style={{
                              color: student.percentage >= 75 ? '#10b981' :
                                     student.percentage >= 50 ? '#3b82f6' :
                                     student.percentage >= 30 ? '#f59e0b' : '#ef4444'
                            }}>
                              {student.percentage}%
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${student.percentage}%`,
                                  backgroundColor: student.percentage >= 75 ? '#10b981' :
                                                 student.percentage >= 50 ? '#3b82f6' :
                                                 student.percentage >= 30 ? '#f59e0b' : '#ef4444'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${student.statusColor}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}