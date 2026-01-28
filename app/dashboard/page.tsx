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
    <div className={`${styles[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl flex items-center gap-3`}>
      <p className="flex-1 font-medium text-sm sm:text-base">{message}</p>
      <button onClick={onClose} className="hover:opacity-75 text-xl sm:text-2xl">×</button>
    </div>
  );
};

export default function SimpleDashboard() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturer, setLecturer] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const [newCourse, setNewCourse] = useState({
    courseName: '',
    courseCode: '',
    department: '',
    level: '',
    customDepartment: '',
    customLevel: '',
    defaultDuration: 15
  });

  const [quickDuration, setQuickDuration] = useState(15);
  const [quickDepartment, setQuickDepartment] = useState('');
  const [quickLevel, setQuickLevel] = useState('');
  const [quickCustomDept, setQuickCustomDept] = useState('');
  const [quickCustomLevel, setQuickCustomLevel] = useState('');

  const DEPARTMENTS = [
    'Computer Science',
    'Software Engineering',
    'Information Technology',
    'Cyber Security',
    'Data Science',
    'Business Administration',
    'Accounting',
    'Mass Communication',
    'Engineering',
    'Medicine',
    'Nursing',
    'Pharmacy',
    'Law',
    'Education',
    'Other (Specify)'
  ];

  const LEVELS = [
    '100 Level',
    '200 Level',
    '300 Level',
    '400 Level',
    '500 Level',
    'NCE 1',
    'NCE 2',
    'NCE 3',
    'HND 1',
    'HND 2',
    'ND 1',
    'ND 2',
    'Year 1',
    'Year 2',
    'Year 3',
    'Year 4',
    'Other (Specify)'
  ];

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const lecturerData = localStorage.getItem('lecturer');
    const token = localStorage.getItem('token');
    
    if (!lecturerData || !token) {
      window.location.href = '/login';
      return;
    }

    const parsedLecturer = JSON.parse(lecturerData);
    setLecturer(parsedLecturer);
    loadData(parsedLecturer.id);
    
    const interval = setInterval(() => loadData(parsedLecturer.id), 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = (lecturerId) => {
    try {
      const allSessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
      const lecturerSessions = allSessions.filter(s => s.lecturerId === lecturerId);
      setSessions(lecturerSessions);

      const allCourses = JSON.parse(localStorage.getItem('savedCourses') || '[]');
      const lecturerCourses = allCourses.filter(c => c.lecturerId === lecturerId);
      setCourses(lecturerCourses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveCourses = (newCourses) => {
    const allCourses = JSON.parse(localStorage.getItem('savedCourses') || '[]');
    const otherCourses = allCourses.filter(c => c.lecturerId !== lecturer.id);
    const updatedCourses = [...otherCourses, ...newCourses];
    localStorage.setItem('savedCourses', JSON.stringify(updatedCourses));
    setCourses(newCourses);
  };

  const saveSessions = (newSessions) => {
    const allSessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
    const otherSessions = allSessions.filter(s => s.lecturerId !== lecturer.id);
    const updatedSessions = [...otherSessions, ...newSessions];
    localStorage.setItem('attendanceSessions', JSON.stringify(updatedSessions));
    setSessions(newSessions);
  };

  const createCourse = () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      showToast('Please fill course name and code', 'error');
      return;
    }

    const finalDepartment = newCourse.department === 'Other (Specify)' 
      ? newCourse.customDepartment 
      : newCourse.department;

    const finalLevel = newCourse.level === 'Other (Specify)' 
      ? newCourse.customLevel 
      : newCourse.level;

    if (!finalDepartment || !finalLevel) {
      showToast('Please select department and level', 'error');
      return;
    }

    const course = {
      id: Date.now().toString(),
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      courseName: newCourse.courseName,
      courseCode: newCourse.courseCode,
      department: finalDepartment,
      level: finalLevel,
      defaultDuration: newCourse.defaultDuration,
      createdAt: new Date().toISOString()
    };

    saveCourses([...courses, course]);
    setNewCourse({ 
      courseName: '', 
      courseCode: '', 
      department: '', 
      level: '', 
      customDepartment: '', 
      customLevel: '', 
      defaultDuration: 15 
    });
    setShowCreateCourse(false);
    showToast(`Course "${course.courseName}" saved!`, 'success');
  };

  const quickStartFromCourse = (course) => {
    const finalDept = quickDepartment === 'Other (Specify)' ? quickCustomDept : quickDepartment;
    const finalLvl = quickLevel === 'Other (Specify)' ? quickCustomLevel : quickLevel;

    if (!finalDept || !finalLvl) {
      showToast('Please select department and level', 'error');
      return;
    }

    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + quickDuration * 60000);
    
    const session = {
      id: sessionId,
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      courseName: course.courseName,
      courseCode: course.courseCode,
      department: finalDept,
      level: finalLvl,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      duration: quickDuration,
      link: `${window.location.origin}/attendance/${sessionId}`,
      status: 'active',
      students: []
    };

    saveSessions([session, ...sessions]);
    setShowQuickStart(false);
    setQuickDepartment('');
    setQuickLevel('');
    setQuickCustomDept('');
    setQuickCustomLevel('');
    navigator.clipboard.writeText(session.link);
    showToast('Attendance started! Link copied!', 'success');
  };

  const superQuickStart = () => {
    if (courses.length === 0) {
      showToast('Please create a course first', 'warning');
      setShowCreateCourse(true);
      return;
    }

    const course = courses[0];
    const sessionId = Date.now().toString();
    const expiryTime = new Date(Date.now() + 15 * 60000);
    
    const session = {
      id: sessionId,
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      courseName: course.courseName,
      courseCode: course.courseCode,
      department: course.department,
      level: course.level,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      duration: 15,
      link: `${window.location.origin}/attendance/${sessionId}`,
      status: 'active',
      students: []
    };

    saveSessions([session, ...sessions]);
    navigator.clipboard.writeText(session.link);
    showToast(`${course.courseName} - Started! Link copied!`, 'success');
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

  const exportToCSV = (session) => {
    const headers = ['#', 'Reg Number', 'Full Name', 'Timestamp'];
    const rows = session.students?.map((student, idx) => [
      idx + 1,
      student.regNumber,
      student.fullName,
      new Date(student.timestamp).toLocaleString()
    ]) || [];

    const csvContent = [
      `Course: ${session.courseName}`,
      `Course Code: ${session.courseCode}`,
      `Department: ${session.department}`,
      `Level: ${session.level}`,
      `Date: ${formatDateTime(session.createdAt)}`,
      `Total Students: ${session.students?.length || 0}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
  };

  const getSessionStatus = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = expiry.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (timeLeft <= 0) return { label: 'Expired', color: 'bg-gray-100 text-gray-600' };
    if (minutesLeft <= 2) return { label: 'Ending Soon', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
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

  const activeSessions = sessions.filter(s => getSessionStatus(s.expiresAt).label !== 'Expired');

  if (!lecturer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center">
        <div className="text-white text-xl sm:text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                📚 Smart Attendance
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                Welcome, <span className="font-bold">{lecturer.name}</span>
              </p>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex gap-2 xl:gap-3">
              <button onClick={superQuickStart} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 xl:px-8 py-2 xl:py-4 rounded-xl font-bold text-sm xl:text-lg hover:shadow-2xl transition transform hover:scale-105">
                ⚡ QUICK START
              </button>
              <button onClick={() => setShowQuickStart(true)} className="bg-blue-600 text-white px-3 xl:px-6 py-2 xl:py-4 rounded-xl font-semibold text-sm xl:text-base hover:bg-blue-700 transition">
                + Choose Course
              </button>
              <button onClick={() => window.location.href = '/analytics'} className="bg-purple-600 text-white px-3 xl:px-6 py-2 xl:py-4 rounded-xl font-semibold text-sm xl:text-base hover:bg-purple-700 transition flex items-center gap-2">
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden xl:inline">Analytics</span>
              </button>
              <button onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('lecturer');
                    localStorage.removeItem('token');
                    showToast('Logged out!', 'success');
                    setTimeout(() => window.location.href = '/login', 1000);
                  }
                }} className="bg-red-500 text-white px-3 xl:px-6 py-2 xl:py-4 rounded-xl font-semibold text-sm xl:text-base hover:bg-red-600 transition flex items-center gap-2">
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden ml-2 p-2 rounded-lg bg-blue-600 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="lg:hidden mt-4 space-y-2 pb-2">
              <button onClick={() => { superQuickStart(); setShowMobileMenu(false); }} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:shadow-lg transition">
                ⚡ QUICK START
              </button>
              <button onClick={() => { setShowQuickStart(true); setShowMobileMenu(false); }} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                + Choose Course
              </button>
              <button onClick={() => { window.location.href = '/analytics'; setShowMobileMenu(false); }} className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
              <button onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('lecturer');
                    localStorage.removeItem('token');
                    showToast('Logged out!', 'success');
                    setTimeout(() => window.location.href = '/login', 1000);
                  }
                }} className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <p className="text-blue-100 text-xs sm:text-sm">Total Sessions</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">{sessions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <p className="text-green-100 text-xs sm:text-sm">Active Now</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">{activeSessions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <p className="text-purple-100 text-xs sm:text-sm">Total Attendees</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">{sessions.reduce((sum, s) => sum + (s.students?.length || 0), 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
            <p className="text-orange-100 text-xs sm:text-sm">Saved Courses</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">{courses.length}</p>
          </div>
        </div>

        {/* Saved Courses */}
        {courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">📚 My Saved Courses</h2>
              <button onClick={() => setShowCreateCourse(true)} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base">
                + New Course
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {courses.map(course => (
                <div key={course.id} className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-base sm:text-lg truncate">{course.courseName}</h3>
                      <p className="text-sm text-gray-600 truncate">{course.courseCode}</p>
                      <p className="text-xs text-blue-600 mt-1 truncate">{course.department} • {course.level}</p>
                    </div>
                    <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700 flex-shrink-0">🗑️</button>
                  </div>
                  <button onClick={() => {
                    setQuickDepartment(course.department);
                    setQuickLevel(course.level);
                    quickStartFromCourse(course);
                  }} className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold text-sm sm:text-base">
                    ⚡ Quick Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🎓 Get Started</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Create your first course to start taking attendance</p>
            <button onClick={() => setShowCreateCourse(true)} className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base">
              + Create First Course
            </button>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-500">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sessions.map(session => {
                const status = getSessionStatus(session.expiresAt);
                return (
                  <div key={session.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onClick={() => setShowSessionDetails(session)}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base truncate">{session.courseName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{session.courseCode}</p>
                        <p className="text-xs text-blue-600 mt-1 truncate">{session.department} • {session.level}</p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${status.color} flex-shrink-0 self-start`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                      <span>👥 {session.students?.length || 0} students</span>
                      <span>{formatTimeAgo(session.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">💾 Create Course</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Save course details for quick attendance sessions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Course Name *</label>
                <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="Computer Science" value={newCourse.courseName} onChange={e => setNewCourse({...newCourse, courseName: e.target.value})} />
              </div>
              <div>
                <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Course Code *</label>
                <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="CSC 101" value={newCourse.courseCode} onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})} />
              </div>
              <div>
                <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Default Duration</label>
                <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={newCourse.defaultDuration} onChange={e => setNewCourse({...newCourse, defaultDuration: parseInt(e.target.value)})}>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Department *</label>
                <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={newCourse.department} onChange={e => setNewCourse({...newCourse, department: e.target.value})}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Level *</label>
                <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}>
                  <option value="">Select Level</option>
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              {newCourse.department === 'Other (Specify)' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Specify Department *</label>
                  <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="Enter department name" value={newCourse.customDepartment} onChange={e => setNewCourse({...newCourse, customDepartment: e.target.value})} />
                </div>
              )}
              {newCourse.level === 'Other (Specify)' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Specify Level *</label>
                  <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="Enter level (e.g., ND3, Diploma Year 2)" value={newCourse.customLevel} onChange={e => setNewCourse({...newCourse, customLevel: e.target.value})} />
                </div>
              )}
            </div>
            {/* FIXED: Better Cancel button styling */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6">
              <button onClick={() => {
                setShowCreateCourse(false);
                setNewCourse({ courseName: '', courseCode: '', department: '', level: '', customDepartment: '', customLevel: '', defaultDuration: 15 });
              }} className="w-full sm:flex-1 bg-red-500 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition shadow-lg text-sm sm:text-base border-2 border-red-600">
                ✕ Cancel
              </button>
              <button onClick={createCourse} className="w-full sm:flex-1 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg text-sm sm:text-base border-2 border-blue-700">
                💾 Save Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Modal */}
      {showQuickStart && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">⚡ Quick Start Attendance</h2>
            {courses.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">No saved courses!</p>
                <button onClick={() => { setShowQuickStart(false); setShowCreateCourse(true); }} className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base">Create First Course</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Duration</label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={quickDuration} onChange={e => setQuickDuration(parseInt(e.target.value))}>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Department *</label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={quickDepartment} onChange={e => setQuickDepartment(e.target.value)}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Level *</label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" value={quickLevel} onChange={e => setQuickLevel(e.target.value)}>
                      <option value="">Select</option>
                      {LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  {quickDepartment === 'Other (Specify)' && (
                    <div className="sm:col-span-3">
                      <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Specify Department</label>
                      <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="Enter department" value={quickCustomDept} onChange={e => setQuickCustomDept(e.target.value)} />
                    </div>
                  )}
                  {quickLevel === 'Other (Specify)' && (
                    <div className="sm:col-span-3">
                      <label className="block font-bold mb-2 text-gray-800 text-sm sm:text-base">Specify Level</label>
                      <input type="text" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-base sm:text-lg" placeholder="Enter level" value={quickCustomLevel} onChange={e => setQuickCustomLevel(e.target.value)} />
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">Select course:</p>
                <div className="space-y-2">
                  {courses.map(course => (
                    <button key={course.id} onClick={() => quickStartFromCourse(course)} className="w-full p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
                      <p className="font-bold text-sm sm:text-base">{course.courseName}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{course.courseCode}</p>
                      <p className="text-xs text-blue-600 mt-1">{course.department} • {course.level}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowQuickStart(false); setShowCreateCourse(true); }} className="w-full mt-4 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm sm:text-base">+ Add New Course</button>
              </>
            )}
            {/* FIXED: Better Cancel button styling */}
            <button onClick={() => {
              setShowQuickStart(false);
              setQuickDepartment('');
              setQuickLevel('');
              setQuickCustomDept('');
              setQuickCustomLevel('');
            }} className="w-full mt-3 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition shadow-lg text-sm sm:text-base border-2 border-red-600">
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 truncate">{showSessionDetails.courseName}</h2>
                  <p className="text-sm sm:text-base text-blue-100 truncate">{showSessionDetails.courseCode}</p>
                  <p className="text-xs sm:text-sm text-blue-200 mt-1 sm:mt-2 truncate">{showSessionDetails.department} • {showSessionDetails.level}</p>
                  <p className="text-xs sm:text-sm text-blue-200">📅 {formatDateTime(showSessionDetails.createdAt)}</p>
                </div>
                <button onClick={() => setShowSessionDetails(null)} className="text-white text-2xl sm:text-3xl hover:opacity-75 flex-shrink-0">✕</button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Attendance List ({showSessionDetails.students?.length || 0})</h3>
              {showSessionDetails.students?.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-500">No students yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-800">#</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-800">REG NUMBER</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-800">NAME</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-800">TIME</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {showSessionDetails.students.map((student, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">{idx + 1}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono font-bold text-gray-900">{student.regNumber}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{student.fullName}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{new Date(student.timestamp).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button onClick={() => { navigator.clipboard.writeText(showSessionDetails.link); showToast('Link copied!', 'success'); }} className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 text-xs sm:text-sm lg:text-base">📋 Copy Link</button>
                <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${showSessionDetails.courseName} Attendance`,
                        text: `Join attendance for ${showSessionDetails.courseName} (${showSessionDetails.courseCode})`,
                        url: showSessionDetails.link
                      }).then(() => showToast('Shared!', 'success')).catch(() => {
                        navigator.clipboard.writeText(showSessionDetails.link);
                        showToast('Link copied! Share manually.', 'info');
                      });
                    } else {
                      navigator.clipboard.writeText(showSessionDetails.link);
                      showToast('Link copied! Share manually.', 'info');
                    }
                  }} className="bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 text-xs sm:text-sm lg:text-base">🔗 Share</button>
                <button onClick={() => exportToCSV(showSessionDetails)} className="bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 text-xs sm:text-sm lg:text-base">📊 Export CSV</button>
                <button onClick={() => {
                    deleteSession(showSessionDetails.id);
                    setShowSessionDetails(null);
                  }} className="bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-700 text-xs sm:text-sm lg:text-base">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}