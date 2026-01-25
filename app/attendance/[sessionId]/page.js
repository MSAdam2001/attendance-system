"use client";

import { useState, useEffect } from 'react';

export default function StudentAttendancePage({ sessionId }) {
  const [formData, setFormData] = useState({
    fullName: '',
    regNumber: ''
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // For demo purposes, create a sample session
    const sampleSession = {
      id: sessionId || 'demo123',
      courseName: 'Computer Science',
      courseCode: 'CSC 101',
      department: 'Computer Science',
      level: '100 Level',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      students: []
    };
    setSession(sampleSession);
    
    const savedData = localStorage.getItem(`attendance_${sessionId}`);
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [session]);

  useEffect(() => {
    if (formData.fullName || formData.regNumber) {
      localStorage.setItem(`attendance_${sessionId}`, JSON.stringify(formData));
    }
  }, [formData, sessionId]);

  const updateTimeLeft = () => {
    if (!session) return;
    
    const now = new Date();
    const expiry = new Date(session.expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) {
      setTimeLeft('Expired');
      return;
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.regNumber.trim()) {
      setError('Please enter your registration number');
      return false;
    }
    const regPattern = /^[A-Z]{2}\d{2}[A-Z]{3}\d{4}$/i;
    if (!regPattern.test(formData.regNumber.replace(/\s/g, ''))) {
      setError('Invalid registration number format. Example: UG24SEN1051');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    
    if (!validateForm()) return;
    
    if (timeLeft === 'Expired') {
      setError('⚠️ Session has expired. Contact your lecturer.');
      return;
    }

    const alreadySubmitted = session.students?.some(
      s => s.regNumber === formData.regNumber
    );
    
    if (alreadySubmitted) {
      setError('⚠️ You have already submitted attendance for this session');
      return;
    }

    setLoading(true);

    const sessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const studentData = {
        fullName: formData.fullName,
        regNumber: formData.regNumber,
        timestamp: new Date().toISOString()
      };
      
      if (!sessions[sessionIndex].students) {
        sessions[sessionIndex].students = [];
      }
      
      sessions[sessionIndex].students.push(studentData);
      localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
      
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
        localStorage.removeItem(`attendance_${sessionId}`);
      }, 1000);
    } else {
      setError('Session not found');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  if (!session && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Session Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Attendance Submitted! ✓</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-2">Successfully recorded for</p>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
            <p className="text-base sm:text-lg font-bold text-blue-700 mb-1 sm:mb-2">{session.courseName}</p>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{session.courseCode}</p>
            <hr className="my-2 sm:my-3" />
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <p className="text-xs sm:text-sm text-gray-700"><strong>Name:</strong> {formData.fullName}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Reg:</strong> {formData.regNumber}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Dept:</strong> {session.department}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Level:</strong> {session.level}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 sm:mt-6">You can close this page</p>
        </div>
      </div>
    );
  }

  const progress = Object.values(formData).filter(Boolean).length / 2 * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 max-w-2xl w-full">
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">✅ Mark Attendance</h1>
          <p className="text-sm sm:text-base text-gray-600">Quick & Easy - Just 2 Fields!</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 border-2 border-blue-200">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Course</p>
              <p className="font-bold text-gray-800 text-base sm:text-lg break-words">{session.courseName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Code</p>
              <p className="font-bold text-gray-800 text-base sm:text-lg">{session.courseCode}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-blue-200">
            <div>
              <p className="text-xs text-blue-600 font-semibold">Department</p>
              <p className="font-bold text-blue-700 text-sm sm:text-base break-words">{session.department}</p>
            </div>
            <div>
              <p className="text-xs text-purple-600 font-semibold">Level</p>
              <p className="font-bold text-purple-700 text-sm sm:text-base">{session.level}</p>
            </div>
          </div>
        </div>

        <div className="mb-5 sm:mb-6">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600">Form Progress</span>
            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 sm:h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
          <div className="flex items-start sm:items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-800">Time Remaining: {timeLeft}</p>
              <p className="text-xs text-yellow-700">Submit before time expires</p>
            </div>
          </div>
        </div>

        {formData.fullName && (
          <div className="bg-green-50 border-l-4 border-green-400 p-2.5 sm:p-3 mb-5 sm:mb-6 rounded">
            <p className="text-xs sm:text-sm text-green-700">✨ Form auto-saved! Verify and submit.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <p className="text-xs sm:text-sm text-red-700 font-medium break-words">{error}</p>
          </div>
        )}

        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 sm:mb-2 text-base sm:text-lg">
              📝 Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-base sm:text-lg"
              placeholder="Abubakar Mohammed Ibrahim"
              autoComplete="name"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your full name as registered</p>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1.5 sm:mb-2 text-base sm:text-lg">
              🎓 Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg sm:text-xl font-mono uppercase"
              placeholder="UG24SEN1051"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1 break-words">Format: UG24SEN1051 (Auto-assigned: {session.department} • {session.level})</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || timeLeft === 'Expired'}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 sm:py-5 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : (
              '✅ Submit Attendance'
            )}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
            ⚠️ <strong>Important:</strong> You can only submit once per session. Department and level are automatically assigned from the session.
          </p>
        </div>
      </div>
    </div>
  );
}