"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Users, Calendar, Plus, Play, BarChart3, LogOut, Menu, X, Clock, 
  Trash2, Copy, Share2, Download, CheckCircle, XCircle, AlertCircle, UserCheck, 
  Lock, RefreshCw, Award, Zap
} from 'lucide-react';

const Toast = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3`}>
      {icons[type]}
      <p className="flex-1 font-medium">{message}</p>
      <button onClick={onClose} className="hover:opacity-75 transition">
        <X className="w-5 h-5" />
      </button>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const [newCourse, setNewCourse] = useState({
    courseName: '', courseCode: '', department: '', level: '',
    customDepartment: '', customLevel: '', defaultDuration: 15
  });

  const [quickDuration, setQuickDuration] = useState(15);
  const [quickDepartment, setQuickDepartment] = useState('');
  const [quickLevel, setQuickLevel] = useState('');
  const [quickCustomDept, setQuickCustomDept] = useState('');
  const [quickCustomLevel, setQuickCustomLevel] = useState('');
  const [quickMaxStudents, setQuickMaxStudents] = useState('');

  const DEPARTMENTS = [
    'Computer Science', 'Software Engineering', 'Information Technology', 'Cyber Security',
    'Data Science', 'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology',
    'Biochemistry', 'Microbiology', 'Civil Engineering', 'Mechanical Engineering',
    'Electrical & Electronics Engineering', 'Chemical Engineering', 'Petroleum Engineering',
    'Computer Engineering', 'Medicine & Surgery', 'Nursing Science', 'Pharmacy',
    'Business Administration', 'Accounting', 'Banking & Finance', 'Marketing',
    'Economics', 'Political Science', 'Mass Communication', 'Law',
    'English Language & Literature', 'History', 'Education', 'Other (Specify)'
  ];

  const LEVELS = [
    '100 Level', '200 Level', '300 Level', '400 Level', '500 Level',
    'NCE 1', 'NCE 2', 'NCE 3', 'HND 1', 'HND 2', 'ND 1', 'ND 2',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Other (Specify)'
  ];

  const showToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
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
    
    const interval = setInterval(() => loadData(parsedLecturer.id, true), 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ NEW: MongoDB sync - runs in parallel with existing loadData
  useEffect(() => {
    if (!lecturer) return;

    const fetchSessionsFromMongoDB = async () => {
      try {
        const response = await fetch(`/api/lecturer/sessions?lecturerId=${lecturer.id}`);
        const data = await response.json();
        
        if (data.success) {
          const sessionsWithStudents = data.sessions.map(session => ({
            ...session,
            students: Array.isArray(session.students) ? session.students : []
          }));
          
          sessionsWithStudents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSessions(sessionsWithStudents);
          
          // Update localStorage with MongoDB data
          const allSessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
          const otherSessions = allSessions.filter(s => s.lecturerId !== lecturer.id);
          const updatedSessions = [...otherSessions, ...sessionsWithStudents];
          localStorage.setItem('attendanceSessions', JSON.stringify(updatedSessions));
        }
      } catch (error) {
        console.error('MongoDB sync error:', error);
        // Fallback to localStorage handled by loadData
      }
    };

    fetchSessionsFromMongoDB();
    const interval = setInterval(fetchSessionsFromMongoDB, 3000);
    return () => clearInterval(interval);
  }, [lecturer]);

  const loadData = (lecturerId, silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      
      const allSessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
      const lecturerSessions = allSessions.filter(s => s.lecturerId === lecturerId);
      
      const sessionsWithStudents = lecturerSessions.map(session => ({
        ...session,
        students: Array.isArray(session.students) ? session.students : []
      }));
      
      sessionsWithStudents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(sessionsWithStudents);

      const allCourses = JSON.parse(localStorage.getItem('savedCourses') || '[]');
      const lecturerCourses = allCourses.filter(c => c.lecturerId === lecturerId);
      setCourses(lecturerCourses);
      
      setLastRefresh(new Date());
      if (!silent) setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsRefreshing(false);
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

    const finalDepartment = newCourse.department === 'Other (Specify)' ? newCourse.customDepartment : newCourse.department;
    const finalLevel = newCourse.level === 'Other (Specify)' ? newCourse.customLevel : newCourse.level;

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

    const updatedCourses = [...courses, course];
    saveCourses(updatedCourses);
    
    setNewCourse({ courseName: '', courseCode: '', department: '', level: '', customDepartment: '', customLevel: '', defaultDuration: 15 });
    setShowCreateCourse(false);
    showToast(`Course "${course.courseName}" saved!`, 'success');
  };

  const quickStartFromCourse = async (course) => {
    const finalDept = quickDepartment === 'Other (Specify)' ? quickCustomDept : quickDepartment;
    const finalLvl = quickLevel === 'Other (Specify)' ? quickCustomLevel : quickLevel;

    if (!finalDept || !finalLvl) {
      showToast('Please select department and level', 'error');
      return;
    }

    let maxStudents = null;
    if (quickMaxStudents && quickMaxStudents.trim() !== '') {
      maxStudents = parseInt(quickMaxStudents);
      if (isNaN(maxStudents) || maxStudents < 1) {
        showToast('Please enter a valid capacity', 'error');
        return;
      }
    }

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.courseName,
          courseCode: course.courseCode,
          department: finalDept,
          level: finalLvl,
          duration: quickDuration,
          maxStudents: maxStudents,
          lecturerId: lecturer.id,
          lecturerName: lecturer.name,
          lecturerEmail: lecturer.email,
          location: null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(data.message || 'Failed', 'error');
        return;
      }

      const session = { ...data.session, students: [] };
      saveSessions([session, ...sessions]);
      
      setShowQuickStart(false);
      setQuickDepartment('');
      setQuickLevel('');
      setQuickCustomDept('');
      setQuickCustomLevel('');
      setQuickMaxStudents('');
      
      navigator.clipboard.writeText(session.link);
      showToast(`Started! Link copied!`, 'success', 5000);
    } catch (error) {
      console.error('Error:', error);
      showToast('Network error', 'error');
    }
  };

  const superQuickStart = async () => {
    if (courses.length === 0) {
      showToast('Create a course first', 'warning');
      setShowCreateCourse(true);
      return;
    }

    const course = courses[0];

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.courseName,
          courseCode: course.courseCode,
          department: course.department,
          level: course.level,
          duration: 15,
          maxStudents: null,
          lecturerId: lecturer.id,
          lecturerName: lecturer.name,
          lecturerEmail: lecturer.email,
          location: null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(data.message || 'Failed', 'error');
        return;
      }

      const session = { ...data.session, students: [] };
      saveSessions([session, ...sessions]);
      
      navigator.clipboard.writeText(session.link);
      showToast(`Started! Link copied!`, 'success', 5000);
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const deleteCourse = (courseId) => {
    if (confirm('Delete?')) {
      saveCourses(courses.filter(c => c.id !== courseId));
      showToast('Deleted', 'info');
    }
  };

  const deleteSession = (sessionId) => {
    if (confirm('Delete?')) {
      saveSessions(sessions.filter(s => s.id !== sessionId));
      showToast('Deleted', 'info');
    }
  };

  const exportToCSV = (session) => {
    const headers = ['#', 'Reg Number', 'Full Name', 'Department', 'Level', 'Timestamp'];
    const rows = session.students?.map((student, idx) => [
      idx + 1,
      student.regNumber,
      student.fullName,
      student.department || session.department,
      student.level || session.level,
      new Date(student.timestamp).toLocaleString()
    ]) || [];

    const csvContent = [
      `Course: ${session.courseName}`,
      `Code: ${session.courseCode}`,
      `Students: ${session.students?.length || 0}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_${session.courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Exported!', 'success');
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const expiry = new Date(session.expiresAt);
    const timeLeft = expiry.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (session.maxStudents && (session.students?.length || 0) >= session.maxStudents) {
      return { label: 'Full', color: 'bg-red-500 text-white', icon: <Lock className="w-4 h-4" /> };
    }

    if (timeLeft <= 0) {
      return { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> };
    }

    if (minutesLeft <= 2) {
      return { label: 'Ending Soon', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-4 h-4" /> };
    }

    return { label: 'Active', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> };
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  const getCapacityPercentage = (session) => {
    if (!session.maxStudents) return null;
    const current = session.students?.length || 0;
    return Math.round((current / session.maxStudents) * 100);
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const activeSessions = sessions.filter(s => {
    const status = getSessionStatus(s);
    return status.label !== 'Expired' && status.label !== 'Full';
  });

  const totalAttendees = sessions.reduce((sum, s) => sum + (s.students?.length || 0), 0);
  const avgAttendance = sessions.length > 0 ? Math.round(totalAttendees / sessions.length) : 0;

  if (!lecturer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
      <div className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-40">
  <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
    <div className="flex justify-between items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              Smart Attendance
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 truncate">
                Welcome, <span className="font-bold">{lecturer.name}</span>
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{formatTimeAgo(lastRefresh)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Menu */}
      <div className="hidden lg:flex gap-3">
        <button onClick={superQuickStart} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition transform hover:scale-105 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          QUICK START
        </button>
        <button onClick={() => setShowQuickStart(true)} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Choose Course
        </button>
        <button onClick={() => window.location.href = '/analytics'} className="bg-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>
        <button onClick={() => {
            if (confirm('Logout?')) {
              localStorage.removeItem('lecturer');
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }} className="bg-red-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-600 transition flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden ml-2 p-2 rounded-lg bg-blue-600 text-white">
        {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>

    {/* Mobile Menu */}
    {showMobileMenu && (
      <div className="lg:hidden mt-4 space-y-2 pb-2">
        <button onClick={() => { superQuickStart(); setShowMobileMenu(false); }} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          QUICK START
        </button>
        <button onClick={() => { setShowQuickStart(true); setShowMobileMenu(false); }} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Choose Course
        </button>
        <button onClick={() => { window.location.href = '/analytics'; setShowMobileMenu(false); }} className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>
        <button onClick={() => {
            if (confirm('Logout?')) {
              localStorage.removeItem('lecturer');
              localStorage.removeItem('token');
              showToast('Logged out!', 'success', 2000);
              setTimeout(() => window.location.href = '/login', 1000);
            }
          }} className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    )}
  </div>
</div>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-100" />
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total Sessions</p>
                <p className="text-4xl font-bold mt-1">{sessions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-100" />
              <div className="text-right">
                <p className="text-green-100 text-sm">Active Now</p>
                <p className="text-4xl font-bold mt-1">{activeSessions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-8 h-8 text-purple-100" />
              <div className="text-right">
                <p className="text-purple-100 text-sm">Total Attendees</p>
                <p className="text-4xl font-bold mt-1">{totalAttendees}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-orange-100" />
              <div className="text-right">
                <p className="text-orange-100 text-sm">Avg/Session</p>
                <p className="text-4xl font-bold mt-1">{avgAttendance}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">My Saved Courses</h2>
                <p className="text-sm text-gray-600 font-medium">{courses.length} course{courses.length !== 1 ? 's' : ''} saved</p>
              </div>
            </div>
            <button onClick={() => setShowCreateCourse(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-md hover:shadow-xl transition">
              <Plus className="w-5 h-5" />
              New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Courses Yet</h3>
              <p className="text-gray-600 mb-6">Create your first course</p>
              <button onClick={() => setShowCreateCourse(true)} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <div key={course.id} className="border-2 border-blue-400 rounded-xl p-6 hover:border-blue-600 hover:shadow-2xl transition bg-gradient-to-br from-white to-blue-50 transform hover:scale-105">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-black text-2xl text-gray-900 truncate leading-tight">{course.courseName}</h3>
                      <p className="text-lg font-black text-blue-700 mt-2 font-mono truncate tracking-wide">{course.courseCode}</p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-bold text-purple-700 truncate">📚 {course.department}</p>
                        <p className="text-sm font-bold text-indigo-700 truncate">🎓 {course.level}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={() => {
                    setQuickDepartment(course.department);
                    setQuickLevel(course.level);
                    setShowQuickStart(true);
                  }} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-700 font-black text-lg shadow-lg hover:shadow-2xl transition transform hover:scale-[1.02] flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Quick Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Recent Sessions</h2>
                <p className="text-sm text-gray-600 font-medium">{sessions.length} total session{sessions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold">{sessions.length}</span>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No sessions yet</p>
              <p className="text-gray-500 text-sm mt-2">Click "Quick Start"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => {
                const status = getSessionStatus(session);
                const currentCount = session.students?.length || 0;
                const hasCapacity = session.maxStudents !== null && session.maxStudents !== undefined;
                const percentage = getCapacityPercentage(session);
                const isFull = hasCapacity && currentCount >= session.maxStudents;
                const timeRemaining = getTimeRemaining(session.expiresAt);
                
                return (
                  <div key={session.id} className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 hover:shadow-2xl transition cursor-pointer border-2 border-gray-300 hover:border-blue-400 transform hover:scale-[1.01]" onClick={() => setShowSessionDetails(session)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-2xl text-gray-900 truncate leading-tight">{session.courseName}</h3>
                        <p className="text-lg font-black text-blue-700 mt-2 font-mono truncate tracking-wide">{session.courseCode}</p>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-bold text-purple-700 truncate">📚 {session.department}</p>
                          <p className="text-sm font-bold text-indigo-700 truncate">🎓 {session.level}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-black ${status.color} flex-shrink-0 flex items-center gap-2 shadow-lg`}>
                          {status.icon}
                          {status.label}
                        </span>
                        {status.label === 'Active' && (
                          <span className="text-xs font-mono font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
                            ⏱️ {timeRemaining}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasCapacity && (
                      <div className="mb-4 bg-white rounded-lg p-3 border-2 border-gray-200">
                        <div className="flex items-center justify-between text-sm font-black text-gray-800 mb-2">
                          <span>📊 CAPACITY</span>
                          <span className="text-base">{currentCount}/{session.maxStudents} <span className="text-gray-600">({percentage}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
                          <div className={`h-full ${getCapacityColor(percentage)} transition-all duration-500 shadow-inner`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm font-black text-gray-800 mt-4 pt-4 border-t-2 border-gray-300">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-blue-200 shadow-sm">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="font-black text-base text-gray-900">
                            {hasCapacity ? `${currentCount}/${session.maxStudents}` : currentCount}
                          </span>
                          <span className="text-gray-600 font-bold">students</span>
                        </span>
                        {isFull && (
                          <span className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-black shadow-lg flex items-center gap-1">
                            <Lock className="w-4 h-4" />
                            FULL
                          </span>
                        )}
                        {!hasCapacity && (
                          <span className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-black shadow-lg">
                            UNLIMITED
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-2 text-gray-700 font-bold">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(session.createdAt)}</span>
                      </span>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <div>
                <h2 className="text-4xl font-black text-gray-900">Create Course</h2>
                <p className="text-sm text-gray-600 font-semibold mt-1">Save course details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-black mb-2 text-gray-900 text-base">Course Name *</label>
                <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" placeholder="Computer Science" value={newCourse.courseName} onChange={e => setNewCourse({...newCourse, courseName: e.target.value})} />
              </div>
              <div>
                <label className="block font-black mb-2 text-gray-900 text-base">Course Code *</label>
                <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-bold font-mono" placeholder="CSC 101" value={newCourse.courseCode} onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})} />
              </div>
              <div>
                <label className="block font-black mb-2 text-gray-900 text-base">Default Duration</label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={newCourse.defaultDuration} onChange={e => setNewCourse({...newCourse, defaultDuration: parseInt(e.target.value)})}>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
              <div>
                <label className="block font-black mb-2 text-gray-900 text-base">Department *</label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={newCourse.department} onChange={e => setNewCourse({...newCourse, department: e.target.value})}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-black mb-2 text-gray-900 text-base">Level *</label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}>
                  <option value="">Select</option>
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              {newCourse.department === 'Other (Specify)' && (
                <div className="sm:col-span-2">
                  <label className="block font-black mb-2 text-gray-900 text-base">Specify Department *</label>
                  <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" placeholder="Enter department" value={newCourse.customDepartment} onChange={e => setNewCourse({...newCourse, customDepartment: e.target.value})} />
                </div>
              )}
              {newCourse.level === 'Other (Specify)' && (
                <div className="sm:col-span-2">
                  <label className="block font-black mb-2 text-gray-900 text-base">Specify Level *</label>
                  <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" placeholder="Enter level" value={newCourse.customLevel} onChange={e => setNewCourse({...newCourse, customLevel: e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => {
                setShowCreateCourse(false);
                setNewCourse({ courseName: '', courseCode: '', department: '', level: '', customDepartment: '', customLevel: '', defaultDuration: 15 });
              }} className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button onClick={createCourse} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Modal */}
      {showQuickStart && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Play className="w-10 h-10 text-green-600" />
              <div>
                <h2 className="text-4xl font-black text-gray-900">Quick Start</h2>
                <p className="text-sm text-gray-600 font-semibold mt-1">Configure and start</p>
              </div>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">No courses!</p>
                <button onClick={() => { setShowQuickStart(false); setShowCreateCourse(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
                  <Plus className="w-5 h-5" />
                  Create Course
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block font-black mb-2 text-gray-900 text-base">Duration</label>
                    <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={quickDuration} onChange={e => setQuickDuration(parseInt(e.target.value))}>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black mb-2 text-gray-900 text-base">Max Students</label>
                    <input type="number" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-bold font-mono" placeholder="Optional" value={quickMaxStudents} onChange={e => setQuickMaxStudents(e.target.value)} min="1" />
                  </div>
                  <div>
                    <label className="block font-black mb-2 text-gray-900 text-base">Department *</label>
                    <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={quickDepartment} onChange={e => setQuickDepartment(e.target.value)}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-black mb-2 text-gray-900 text-base">Level *</label>
                    <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" value={quickLevel} onChange={e => setQuickLevel(e.target.value)}>
                      <option value="">Select</option>
                      {LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  {quickDepartment === 'Other (Specify)' && (
                    <div className="sm:col-span-2">
                      <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" placeholder="Enter department" value={quickCustomDept} onChange={e => setQuickCustomDept(e.target.value)} />
                    </div>
                  )}
                  {quickLevel === 'Other (Specify)' && (
                    <div className="sm:col-span-2">
                      <input type="text" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black bg-white focus:border-blue-500 focus:outline-none text-lg font-medium" placeholder="Enter level" value={quickCustomLevel} onChange={e => setQuickCustomLevel(e.target.value)} />
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-4 font-bold">Select course:</p>
                <div className="space-y-3">
                  {courses.map(course => (
                    <button key={course.id} onClick={() => quickStartFromCourse(course)} className="w-full p-5 bg-blue-50 hover:bg-blue-100 rounded-xl text-left transition border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-lg">
                      <p className="font-black text-xl text-gray-900">{course.courseName}</p>
                      <p className="text-base text-blue-700 font-black font-mono mt-1">{course.courseCode}</p>
                      <p className="text-sm text-purple-700 mt-2 font-bold">📚 {course.department} • 🎓 {course.level}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => {
              setShowQuickStart(false);
              setQuickDepartment('');
              setQuickLevel('');
              setQuickCustomDept('');
              setQuickCustomLevel('');
              setQuickMaxStudents('');
            }} className="w-full mt-3 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
{showSessionDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-3xl font-bold mb-2 truncate">{showSessionDetails.courseName}</h2>
            <p className="text-blue-100 truncate font-mono font-bold">{showSessionDetails.courseCode}</p>
            <p className="text-sm text-blue-200 mt-2 truncate">{showSessionDetails.department} • {showSessionDetails.level}</p>
            
            {/* DISPLAY LINK */}
            <div className="mt-3 bg-white bg-opacity-10 rounded-lg p-3">
              <p className="text-xs text-blue-100 mb-1">Link:</p>
              <p className="text-sm font-mono break-all">{showSessionDetails.link}</p>
            </div>

            <p className="text-sm text-blue-200 flex items-center gap-1 mt-2">
              <Calendar className="w-4 h-4" />
              {formatDateTime(showSessionDetails.createdAt)}
            </p>
            {showSessionDetails.maxStudents ? (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm text-blue-100 mb-1">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {showSessionDetails.students?.length || 0}/{showSessionDetails.maxStudents}</span>
                </div>
                <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min((showSessionDetails.students?.length || 0) / showSessionDetails.maxStudents * 100, 100)}%` }}></div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-200 flex items-center gap-1 mt-1">
                <Users className="w-4 h-4" />
                Unlimited • {showSessionDetails.students?.length || 0} students
              </p>
            )}
          </div>
          <button onClick={() => setShowSessionDetails(null)} className="text-white hover:opacity-75 flex-shrink-0">
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Attendance ({showSessionDetails.students?.length || 0})
        </h3>
        
        {!showSessionDetails.students || showSessionDetails.students.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No students yet</p>
            <p className="text-sm text-gray-500 mt-2">Share the link</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-black text-white border-r border-white border-opacity-30">#</th>
                  <th className="px-4 py-4 text-left text-sm font-black text-white border-r border-white border-opacity-30">REG NUMBER</th>
                  <th className="px-4 py-4 text-left text-sm font-black text-white border-r border-white border-opacity-30">NAME</th>
                  <th className="px-4 py-4 text-left text-sm font-black text-white">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-300 bg-white">
                {showSessionDetails.students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-4 text-base font-black text-gray-900 border-r border-gray-200">{idx + 1}</td>
                    <td className="px-4 py-4 text-base font-black text-blue-700 font-mono border-r border-gray-200">{student.regNumber}</td>
                    <td className="px-4 py-4 text-base font-bold text-gray-900 border-r border-gray-200">{student.fullName}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-700">{new Date(student.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={() => { navigator.clipboard.writeText(showSessionDetails.link); showToast('Copied!', 'success', 2000); }} className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
            <Copy className="w-5 h-5" />
            Copy Link
          </button>
          <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title: showSessionDetails.courseName, url: showSessionDetails.link }).catch(() => {
                  navigator.clipboard.writeText(showSessionDetails.link);
                  showToast('Copied!', 'info', 2000);
                });
              } else {
                navigator.clipboard.writeText(showSessionDetails.link);
                showToast('Copied!', 'info', 2000);
              }
            }} className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
            <Share2 className="w-5 h-5" />
            Share Link
          </button>
          <button onClick={() => exportToCSV(showSessionDetails)} className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button onClick={() => { deleteSession(showSessionDetails.id); setShowSessionDetails(null); }} className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition">
            <Trash2 className="w-5 h-5" />
            Delete Session
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}