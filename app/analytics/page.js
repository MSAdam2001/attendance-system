
"use client";

import React, { useState, useEffect } from 'react';
import { Download, Users, BookOpen, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lecturer, setLecturer] = useState(null);

  useEffect(() => {
    const lecturerData = localStorage.getItem('lecturer');
    if (lecturerData) {
      setLecturer(JSON.parse(lecturerData));
    }
    loadData();
  }, [selectedCourse]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    try {
      // Load sessions
      const sessionsRes = await fetch('/api/sessions/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sessionsData = await sessionsRes.json();
      
      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
        console.log('✅ Sessions loaded:', sessionsData.sessions.length);
      } else {
        console.error('❌ Sessions error:', sessionsData.message);
      }

      // Load analytics
      const analyticsUrl = selectedCourse 
        ? `/api/analytics/semester?courseCode=${selectedCourse}`
        : '/api/analytics/semester';
      
      console.log('📊 Fetching analytics from:', analyticsUrl);
      
      const analyticsRes = await fetch(analyticsUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const analyticsData = await analyticsRes.json();
      console.log('📊 Analytics response:', analyticsData);
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
        console.log('✅ Analytics loaded:', {
          totalSessions: analyticsData.data.totalSessions,
          totalStudents: analyticsData.data.totalStudents,
          averageAttendance: analyticsData.data.summary.averageAttendance
        });
      } else {
        console.error('❌ Analytics error:', analyticsData.message);
        setError(analyticsData.message);
      }

      // Load courses
      const coursesRes = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();
      
      if (coursesData.success) {
        setCourses(coursesData.courses);
        console.log('✅ Courses loaded:', coursesData.courses.length);
      } else {
        console.error('❌ Courses error:', coursesData.message);
      }
    } catch (error) {
      console.error('💥 Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!analytics) return;
    
    const csv = [
      ['Reg No', 'Name', 'Department', 'Level', 'Attended', 'Missed', 'Total', 'Percentage', 'Status'],
      ...analytics.analytics.map(s => [
        s.registrationNumber,
        s.name,
        s.department,
        s.level,
        s.attendedSessions,
        s.missedSessions,
        analytics.totalSessions,
        s.attendancePercentage + '%',
        s.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={loadData}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📊 Semester Analytics</h1>
                <p className="text-gray-600 mt-1">Welcome, {lecturer?.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {['overview', 'analytics', 'sessions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.totalSessions}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{analytics.totalStudents}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg Attendance</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.summary.averageAttendance}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Courses</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{courses.length}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Status Distribution</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{analytics.summary.excellent}</p>
                  <p className="text-sm text-green-600">Excellent (≥75%)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{analytics.summary.good}</p>
                  <p className="text-sm text-blue-600">Good (60-74%)</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">{analytics.summary.warning}</p>
                  <p className="text-sm text-yellow-600">Warning (50-59%)</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">{analytics.summary.critical}</p>
                  <p className="text-sm text-red-600">Critical (<50%)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Detailed Student Analytics</h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.courseCode}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reg No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Level</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Attended</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Missed</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.analytics.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.registrationNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.level}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">{student.attendedSessions}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">{student.missedSessions}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">{analytics.totalSessions}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="font-bold text-blue-600">{student.attendancePercentage}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Sessions</h2>
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.courseName}</h3>
                      <p className="text-sm text-gray-600">{session.courseCode}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{session.students?.length || 0}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}