"use client";

import { useState, useEffect } from "react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3`}>
      <p className="flex-1 font-medium">{message}</p>
      <button onClick={onClose} className="hover:opacity-75 text-2xl">×</button>
    </div>
  );
};

export default function SimpleDashboard() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  const [newCourse, setNewCourse] = useState({
    courseName: '',
    courseCode: '',
    defaultDuration: 15
  });

  const [quickDuration, setQuickDuration] = useState(15);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    try {
      const savedSessions = localStorage.getItem('attendanceSessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }

      const savedCourses = localStorage.getItem('savedCourses');
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveCourses = (data) => {
    localStorage.setItem('savedCourses', JSON.stringify(data));
    setCourses(data);
  };

  const saveSessions = (data) => {
    localStorage.setItem('attendanceSessions', JSON.stringify(data));
    setSessions(data);
  };

  const createCourse = () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      showToast('Please fill course name and code', 'error');
      return;
    }

    const course = {
      id: Date.now().toString(),
      ...newCourse,
      createdAt: new Date().toISOString()
    };

    saveCourses([...courses, course]);
    
    setNewCourse({ courseName: '', courseCode: '', defaultDuration: 15 });
    setShowCreateCourse(false);
    
    showToast(`Course "${course.courseName}" saved!`, 'success');
  };

  const quickStartFromCourse = (course) => {
    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + quickDuration * 60000);
    
    const session = {
      id: sessionId,
      courseName: course.courseName,
      courseCode: course.courseCode,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      duration: quickDuration,
      link: `${window.location.origin}/attendance/${sessionId}`,
      status: 'active',
      students: []
    };

    saveSessions([session, ...sessions]);
    setShowQuickStart(false);
    
    navigator.clipboard.writeText(session.link);
    showToast('Attendance started! Link copied!', 'success');
  };

  const superQuickStart = () => {
    if (sessions.length === 0 && courses.length === 0) {
      showToast('Please create a course first', 'warning');
      setShowCreateCourse(true);
      return;
    }

    let courseName, courseCode;

    if (courses.length > 0) {
      courseName = courses[0].courseName;
      courseCode = courses[0].courseCode;
    } else {
      courseName = sessions[0].courseName;
      courseCode = sessions[0].courseCode;
    }

    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + 15 * 60000);
    
    const session = {
      id: sessionId,
      courseName,
      courseCode,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      duration: 15,
      link: `${window.location.origin}/attendance/${sessionId}`,
      status: 'active',
      students: []
    };

    saveSessions([session, ...sessions]);
    
    navigator.clipboard.writeText(session.link);
    showToast(`${courseName} - Started! Link copied!`, 'success');
  };

  const deleteCourse = (courseId) => {
    if (confirm('Delete this saved course?')) {
      saveCourses(courses.filter(c => c.id !== courseId));
      showToast('Course deleted', 'info');
    }
  };

  const deleteSession = (sessionId) => {
    if (confirm('Delete this session?')) {
      saveSessions(sessions.filter(s => s.id !== sessionId));
      showToast('Session deleted', 'info');
    }
  };

  const getSessionStatus = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
const timeLeft = expiry.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (timeLeft <= 0) return { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: '🔒' };
    if (minutesLeft <= 2) return { label: 'Ending Soon', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' };
    return { label: 'Active', color: 'bg-green-100 text-green-700', icon: '✅' };
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStudentStats = () => {
    const studentMap = new Map();
    
    sessions.forEach(session => {
      session.students?.forEach(student => {
        const key = student.regNumber;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            ...student,
            attended: 0,
            sessions: []
          });
        }
        const studentData = studentMap.get(key);
        studentData.attended += 1;
        studentData.sessions.push({
          course: session.courseName,
          code: session.courseCode,
          date: session.createdAt
        });
      });
    });

    return Array.from(studentMap.values()).map(student => ({
      ...student,
      percentage: sessions.length > 0 ? ((student.attended / sessions.length) * 100).toFixed(1) : 0
    })).sort((a, b) => b.attended - a.attended);
  };

  const generateCSV = (session) => {
    const headers = ['#', 'Reg Number', 'Full Name', 'Department', 'Timestamp'];
    const rows = session.students?.map((student, idx) => [
      idx + 1,
      student.regNumber,
      student.fullName,
      student.department,
      new Date(student.timestamp).toLocaleString()
    ]) || [];

    const csvContent = [
      `Course: ${session.courseName}`,
      `Course Code: ${session.courseCode}`,
      `Date: ${formatDateTime(session.createdAt)}`,
      `Total Students: ${session.students?.length || 0}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  const exportAllAttendance = () => {
    const studentMap = new Map();
    
    sessions.forEach(session => {
      session.students?.forEach(student => {
        const key = student.regNumber;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            regNumber: student.regNumber,
            fullName: student.fullName,
            department: student.department,
            sessions: {}
          });
        }
        const studentData = studentMap.get(key);
        studentData.sessions[session.courseCode] = '✓';
      });
    });

    const allCourses = [...new Set(sessions.map(s => s.courseCode))];
    const headers = ['Reg Number', 'Full Name', 'Department', ...allCourses, 'Total', 'Percentage'];
    
    const rows = Array.from(studentMap.values()).map(student => {
      const attended = Object.keys(student.sessions).length;
      const percentage = sessions.length > 0 ? ((attended / sessions.length) * 100).toFixed(1) : 0;
      
      return [
        student.regNumber,
        student.fullName,
        student.department,
        ...allCourses.map(course => student.sessions[course] || '✗'),
        attended,
        `${percentage}%`
      ];
    });

    const csvContent = [
      'Attendance Aggregation Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Sessions: ${sessions.length}`,
      `Total Students: ${studentMap.size}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_aggregation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Aggregated report exported!', 'success');
  };

  const activeSessions = sessions.filter(s => getSessionStatus(s.expiresAt).label !== 'Expired');
  const totalAttendance = sessions.reduce((acc, s) => acc + (s.students?.length || 0), 0);
  const studentStats = getStudentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📚 Smart Attendance
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={superQuickStart}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
              >
                ⚡ QUICK START
              </button>
              <button
                onClick={() => setShowQuickStart(true)}
                className="bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                + Choose Course
              </button>
              <button
                onClick={() => window.location.href = '/analytics'}
                className="bg-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('lecturer');
                    localStorage.removeItem('sessionExpiry');
                    showToast('Logged out successfully!', 'success');
                    setTimeout(() => {
                      window.location.href = '/login';
                    }, 1000);
                  }
                }}
                className="bg-red-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-600 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <p className="text-blue-100 text-sm">Total Sessions</p>
            <p className="text-4xl font-bold mt-2">{sessions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <p className="text-green-100 text-sm">Active Now</p>
            <p className="text-4xl font-bold mt-2">{activeSessions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <p className="text-purple-100 text-sm">Total Students</p>
            <p className="text-4xl font-bold mt-2">{studentStats.length}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <p className="text-orange-100 text-sm">Saved Courses</p>
            <p className="text-4xl font-bold mt-2">{courses.length}</p>
          </div>
        </div>

        {courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">📚 My Saved Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.map(course => (
                <div key={course.id} className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{course.courseName}</h3>
                      <p className="text-sm text-gray-600">{course.courseCode}</p>
                    </div>
                    <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700">
                      🗑️
                    </button>
                  </div>
                  <button
                    onClick={() => quickStartFromCourse(course)}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold"
                  >
                    ⚡ Quick Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Sessions</h2>

            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-6">No sessions yet</p>
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Save First Course
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.map(session => {
                  const status = getSessionStatus(session.expiresAt);
                  return (
                    <div
                      key={session.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => setShowSessionDetails(session)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{session.courseName}</h3>
                          <p className="text-sm text-gray-600">{session.courseCode}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>👥 {session.students?.length || 0} students</span>
                        <span>{formatTimeAgo(session.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Student Overview</h2>

            {studentStats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No data yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {studentStats.slice(0, 10).map((student, idx) => (
                  <div key={student.regNumber} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">#{idx + 1} {student.fullName}</h4>
                        <p className="text-sm text-gray-600">{student.regNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          student.percentage >= 75 ? 'text-green-600' :
                          student.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.percentage}%
                        </p>
                        <p className="text-xs text-gray-500">{student.attended}/{sessions.length}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          student.percentage >= 75 ? 'bg-green-500' :
                          student.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${student.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold mb-2">💾 Save Course</h2>
            <p className="text-gray-600 mb-6">Fill once, reuse forever!</p>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2 text-gray-800">Course Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Computer Science"
                  value={newCourse.courseName}
                  onChange={e => setNewCourse({...newCourse, courseName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block font-bold mb-2 text-gray-800">Course Code *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="CSC 101"
                  value={newCourse.courseCode}
                  onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-gray-800">Default Duration</label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg"
                  value={newCourse.defaultDuration}
                  onChange={e => setNewCourse({...newCourse, defaultDuration: parseInt(e.target.value)})}
                >
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateCourse(false)}
                className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createCourse}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickStart && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">⚡ Quick Start</h2>

            {courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-6">No saved courses!</p>
                <button
                  onClick={() => {
                    setShowQuickStart(false);
                    setShowCreateCourse(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create First Course
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block font-bold mb-2 text-gray-800">Duration</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg"
                    value={quickDuration}
                    onChange={e => setQuickDuration(parseInt(e.target.value))}
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                <p className="text-sm text-gray-600 mb-3">Select course:</p>
                <div className="space-y-2">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => quickStartFromCourse(course)}
                      className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition"
                    >
                      <p className="font-bold">{course.courseName}</p>
                      <p className="text-sm text-gray-600">{course.courseCode}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowQuickStart(false);
                    setShowCreateCourse(true);
                  }}
                  className="w-full mt-4 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  + Add New Course
                </button>
              </>
            )}

            <button
              onClick={() => setShowQuickStart(false)}
              className="w-full mt-3 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{showSessionDetails.courseName}</h2>
                  <p className="text-blue-100">{showSessionDetails.courseCode}</p>
                  <p className="text-sm text-blue-200 mt-2">📅 {formatDateTime(showSessionDetails.createdAt)}</p>
                </div>
                <button onClick={() => setShowSessionDetails(null)} className="text-white text-3xl hover:opacity-75">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-700 font-semibold">Duration</p>
                  <p className="text-2xl font-bold text-blue-600">{showSessionDetails.duration} min</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-700 font-semibold">Students</p>
                  <p className="text-2xl font-bold text-green-600">{showSessionDetails.students?.length || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-700 font-semibold">Status</p>
                  <p className="text-lg font-bold text-purple-600">{getSessionStatus(showSessionDetails.expiresAt).label}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 text-gray-900">Attendance List</h3>
              
              {showSessionDetails.students?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No students yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">REG NUMBER</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">NAME</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">DEPT</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {showSessionDetails.students.map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900">{student.regNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.fullName}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{student.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{new Date(student.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showSessionDetails.link);
                    showToast('Link copied!', 'success');
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${showSessionDetails.courseName} Attendance`,
                        text: `Join attendance for ${showSessionDetails.courseName} (${showSessionDetails.courseCode})`,
                        url: showSessionDetails.link
                      }).then(() => {
                        showToast('Shared successfully!', 'success');
                      }).catch(() => {
                        navigator.clipboard.writeText(showSessionDetails.link);
                        showToast('Link copied! Share manually.', 'info');
                      });
                    } else {
                      navigator.clipboard.writeText(showSessionDetails.link);
                      showToast('Link copied! Share manually.', 'info');
                    }
                  }}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  🔗 Share Link
                </button>
                <button
                  onClick={() => {
                    const csvContent = generateCSV(showSessionDetails);
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${showSessionDetails.courseCode}_${new Date(showSessionDetails.createdAt).toISOString().split('T')[0]}.csv`;
                    a.click();
                    showToast('Attendance exported!', 'success');
                  }}
                  className="bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  📊 Export CSV
                </button>
                <button
                  onClick={() => {
                    deleteSession(showSessionDetails.id);
                    setShowSessionDetails(null);
                  }}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}