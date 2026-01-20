"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function StudentAttendancePage() {
  const params = useParams();
  const sessionId = params.sessionId;

  const [formData, setFormData] = useState({
    fullName: '',
    regNumber: '',
    department: '',
    level: ''
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // All Nigerian departments (same list as before)
  const departments = [
    'Biochemistry', 'Biology', 'Botany', 'Chemistry', 'Computer Science',
    'Environmental Science', 'Geography', 'Geology', 'Mathematics',
    'Microbiology', 'Physics', 'Statistics', 'Zoology',
    'Agricultural Engineering', 'Chemical Engineering', 'Civil Engineering',
    'Computer Engineering', 'Electrical Engineering', 'Industrial Engineering',
    'Marine Engineering', 'Mechanical Engineering', 'Metallurgical Engineering',
    'Petroleum Engineering', 'Software Engineering', 'Structural Engineering',
    'Anatomy', 'Dentistry', 'Medical Laboratory Science', 'Medicine & Surgery',
    'Nursing', 'Pharmacy', 'Physiology', 'Physiotherapy', 'Public Health',
    'Criminology', 'Economics', 'International Relations', 'Mass Communication',
    'Political Science', 'Psychology', 'Public Administration', 'Social Work',
    'Sociology', 'Arabic Studies', 'Christian Religious Studies', 'English Language',
    'Fine Arts', 'Foreign Languages', 'History', 'Islamic Studies',
    'Linguistics', 'Music', 'Philosophy', 'Religious Studies', 'Theatre Arts',
    'Accounting', 'Banking & Finance', 'Business Administration',
    'Business Management', 'Entrepreneurship', 'Human Resource Management',
    'Insurance', 'Marketing', 'Adult Education', 'Agricultural Science Education',
    'Biology Education', 'Business Education', 'Chemistry Education',
    'Computer Science Education', 'Early Childhood Education', 'Economics Education',
    'Education & Arabic', 'Education & Biology', 'Education & Chemistry',
    'Education & Computer Science', 'Education & Economics', 'Education & English',
    'Education & French', 'Education & Geography', 'Education & History',
    'Education & Mathematics', 'Education & Physics', 'Education & Political Science',
    'Education & Religious Studies', 'Education & Social Studies',
    'Educational Administration', 'Educational Psychology', 'Educational Technology',
    'English Language Education', 'Geography Education', 'Guidance & Counselling',
    'Health Education', 'History Education', 'Home Economics Education',
    'Library & Information Science', 'Mathematics Education', 'Music Education',
    'Physical & Health Education', 'Physics Education', 'Primary Education',
    'Science Education', 'Social Studies Education', 'Special Education',
    'Technical Education', 'Vocational Education', 'Common Law', 'Islamic Law', 'Law',
    'Agricultural Economics', 'Agriculture', 'Animal Science', 'Crop Science',
    'Fisheries', 'Food Science & Technology', 'Forestry', 'Soil Science',
    'Architecture', 'Building Technology', 'Estate Management', 'Quantity Surveying',
    'Surveying & Geoinformatics', 'Urban & Regional Planning',
    'Artificial Intelligence', 'Cyber Security', 'Data Science',
    'Information Technology', 'Library Science', 'Other'
  ].sort();

  const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level'];

  useEffect(() => {
    loadSession();
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

  const loadSession = () => {
    const sessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
    const foundSession = sessions.find(s => s.id === sessionId);
    
    if (foundSession) {
      setSession(foundSession);
      
      // Check if already submitted
      const alreadySubmitted = foundSession.students?.some(
        s => s.regNumber === formData.regNumber
      );
      if (alreadySubmitted) {
        setSubmitted(true);
      }
    } else {
      setError('Session not found or expired');
    }
  };

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
    if (!formData.department) {
      setError('Please select your department');
      return false;
    }
    if (!formData.level) {
      setError('Please select your level');
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

    // Check if already submitted
    const alreadySubmitted = session.students?.some(
      s => s.regNumber === formData.regNumber
    );
    
    if (alreadySubmitted) {
      setError('⚠️ You have already submitted attendance for this session');
      return;
    }

    setLoading(true);

    // Add student to session
    const sessions = JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const studentData = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      if (!sessions[sessionIndex].students) {
        sessions[sessionIndex].students = [];
      }
      
      sessions[sessionIndex].students.push(studentData);
      localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
      
      console.log('✅ Attendance submitted:', studentData);
      
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Attendance Submitted! ✓</h2>
          <p className="text-gray-600 mb-2">Successfully recorded</p>
          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-700"><strong>Name:</strong> {formData.fullName}</p>
            <p className="text-sm text-gray-700"><strong>Reg:</strong> {formData.regNumber}</p>
            <p className="text-sm text-gray-700"><strong>Dept:</strong> {formData.department}</p>
            <p className="text-sm text-gray-700"><strong>Level:</strong> {formData.level}</p>
          </div>
          <p className="text-xs text-gray-500 mt-6">You can close this page</p>
        </div>
      </div>
    );
  }

  const progress = Object.values(formData).filter(Boolean).length / 4 * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mark Attendance</h1>
          <p className="text-gray-600">Smart Attendance System</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Course:</p>
              <p className="font-bold text-gray-800">{session.courseName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Code:</p>
              <p className="font-bold text-gray-800">{session.courseCode}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Form Progress</span>
            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-yellow-800">Time: {timeLeft}</p>
              <p className="text-xs text-yellow-700">Submit before expiry</p>
            </div>
          </div>
        </div>

        {formData.fullName && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-6 rounded">
            <p className="text-sm text-green-700">✨ Auto-filled! Verify and submit.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg"
              placeholder="Abubakar Mohammed Ibrahim"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Registration Number *</label>
            <input
              type="text"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg font-mono"
              placeholder="UG24SEN1051"
            />
            <p className="text-xs text-gray-500 mt-1">Format: UG24SEN1051</p>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Level *</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg"
            >
              <option value="">Select Level</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || timeLeft === 'Expired'}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Submitting...' : '✅ Submit Attendance'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            ⚠️ You can only submit once per session
          </p>
        </div>
      </div>
    </div>
  );
}