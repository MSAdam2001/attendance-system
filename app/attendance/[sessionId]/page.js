"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle,
  Loader2,
  XCircle,
  User,
  Hash,
  Users
} from 'lucide-react';

export default function StudentAttendancePage() {
  const params = useParams();
  const sessionId = params?.sessionId;

  const [formData, setFormData] = useState({
    fullName: '',
    regNumber: '',
    department: '',
    level: ''
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [fetchingSession, setFetchingSession] = useState(true);

  // ===== FETCH SESSION FROM BACKEND API =====
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid attendance link');
      setFetchingSession(false);
      return;
    }

    fetchSessionFromAPI();
  }, [sessionId]);

  const fetchSessionFromAPI = async () => {
    try {
      setFetchingSession(true);
      
      const response = await fetch(`/api/attendance/session/${sessionId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Session not found or has been deleted');
        setFetchingSession(false);
        return;
      }

      setSession(data.session);
      
      // Pre-fill department and level if available
      setFormData(prev => ({
        ...prev,
        department: data.session.department || '',
        level: data.session.level || ''
      }));
      
      setFetchingSession(false);
      checkPreviousSubmission();
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session. Please check your internet connection.');
      setFetchingSession(false);
    }
  };

  useEffect(() => {
    if (session) {
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [session]);

  useEffect(() => {
    if (session && !location) {
      requestLocation();
    }
  }, [session]);

  const checkPreviousSubmission = () => {
    const previousSubmission = localStorage.getItem(`submitted_${sessionId}`);
    if (previousSubmission) {
      const data = JSON.parse(previousSubmission);
      setSubmittedData(data);
      setFormData(data);
      setSubmitted(true);
    }
  };

  const requestLocation = () => {
    setGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('❌ Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Location access denied. Please enable location to mark attendance.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Location request timed out.';
            break;
          default:
            errorMessage = '❌ An unknown error occurred.';
        }
        setLocationError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
    
    // FLEXIBLE VALIDATION - accepts ANY format
    const regNumber = formData.regNumber.trim();
    const hasLetter = /[a-zA-Z]/.test(regNumber);
    const hasNumber = /\d/.test(regNumber);
    const isValidLength = regNumber.length >= 4;
    
    if (!isValidLength) {
      setError('Registration number must be at least 4 characters long');
      return false;
    }
    
    if (!hasLetter || !hasNumber) {
      setError('Registration number must contain both letters and numbers');
      return false;
    }
    
    const hasInvalidChars = /[^a-zA-Z0-9\-\/_]/.test(regNumber);
    if (hasInvalidChars) {
      setError('Registration number can only contain letters, numbers, hyphens (-), slashes (/), and underscores (_)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) return;
    
    if (timeLeft === 'Expired') {
      setError('⚠️ Session has expired. Contact your lecturer.');
      return;
    }

    // Allow submission even without location for sessions that don't require it
    const shouldRequireLocation = session.location && session.location.latitude && session.location.longitude;
    
    if (shouldRequireLocation && !location) {
      setError('📍 Location is required. Please allow location access and try again.');
      requestLocation();
      return;
    }

    setLoading(true);

    try {
      // ===== SUBMIT TO BACKEND API =====
      const response = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          secureToken: session.secureToken,
          fullName: formData.fullName.trim(),
          regNumber: formData.regNumber.trim(),
          department: formData.department || session.department,
          level: formData.level || session.level,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Show detailed error message from backend
        setError(data.message || 'Failed to submit attendance. Please try again.');
        setLoading(false);
        return;
      }

      // ===== SUCCESS - SAVE TO LOCALSTORAGE =====
      const submissionData = {
        fullName: formData.fullName,
        regNumber: formData.regNumber.toUpperCase(),
        department: formData.department || session.department,
        level: formData.level || session.level,
        timestamp: data.data.markedAt,
        courseName: session.courseName,
        courseCode: session.courseCode
      };

      localStorage.setItem(`submitted_${sessionId}`, JSON.stringify(submissionData));
      
      setSubmittedData(submissionData);
      setLoading(false);
      setSubmitted(true);

    } catch (err) {
      console.error('Submission error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // ===== LOADING STATE =====
  if (fetchingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <Loader2 className="w-10 h-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE (SESSION NOT FOUND) =====
  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Session Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-500">Please check the link or contact your lecturer</p>
        </div>
      </div>
    );
  }

  // ===== SUCCESS STATE =====
  if (submitted && submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Attendance Submitted! ✓</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-2">Successfully recorded for</p>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
            <p className="text-base sm:text-lg font-bold text-blue-700 mb-1 sm:mb-2">
              {submittedData.courseName || session.courseName}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              {submittedData.courseCode || session.courseCode}
            </p>
            <hr className="my-2 sm:my-3" />
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <p className="text-xs sm:text-sm text-gray-700"><strong>Name:</strong> {submittedData.fullName}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Reg:</strong> {submittedData.regNumber}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Dept:</strong> {submittedData.department}</p>
              <p className="text-xs sm:text-sm text-gray-700"><strong>Level:</strong> {submittedData.level}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 sm:mt-6">You can close this page</p>
        </div>
      </div>
    );
  }

  if (timeLeft === 'Expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Session Expired</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">This attendance session has ended</p>
          <p className="text-xs text-gray-500">Contact your lecturer if you need assistance</p>
        </div>
      </div>
    );
  }

  const progress = Object.values({
    fullName: formData.fullName,
    regNumber: formData.regNumber
  }).filter(Boolean).length / 2 * 100;

  const shouldRequireLocation = session.location && session.location.latitude && session.location.longitude;
  const canSubmit = formData.fullName.trim() && formData.regNumber.trim() && 
                    (!shouldRequireLocation || location) && 
                    timeLeft !== 'Expired';

  // ===== MAIN FORM =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 max-w-2xl w-full">
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">✅ Mark Attendance</h1>
          <p className="text-sm sm:text-base text-gray-600">Quick & Secure Attendance</p>
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

        {/* Capacity Progress */}
        {session.maxStudents && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-900">Capacity</span>
              </div>
              <span className="text-sm font-bold text-orange-900">
                {session.students?.length || 0}/{session.maxStudents}
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(((session.students?.length || 0) / session.maxStudents) * 100, 100)}%` 
                }}
              />
            </div>
            {session.students?.length >= session.maxStudents && (
              <p className="text-xs text-red-700 font-bold mt-2">⚠️ Session is at full capacity!</p>
            )}
          </div>
        )}

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

        {gettingLocation && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-700">📍 Getting your location...</p>
            </div>
          </div>
        )}

        {location && !gettingLocation && shouldRequireLocation && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-semibold">✅ Location verified - You're in range!</p>
            </div>
          </div>
        )}

        {!shouldRequireLocation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-700">Session location not configured by lecturer</p>
            </div>
          </div>
        )}

        {locationError && shouldRequireLocation && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <p className="text-sm text-red-700">{locationError}</p>
            <button 
              onClick={requestLocation}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 sm:p-4 mb-5 sm:mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-bold">Time Remaining</span>
          </div>
          <p className="text-3xl sm:text-4xl font-black font-mono">{timeLeft}</p>
          <p className="text-xs mt-1">Submit before time expires</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-5 sm:mb-6 rounded">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">Submission Failed</p>
                <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 sm:mb-2 text-base sm:text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              📝 Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-base sm:text-lg"
              placeholder="Enter your full name as registered"
              autoComplete="name"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter your full name as registered</p>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1.5 sm:mb-2 text-base sm:text-lg flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600" />
              🎓 Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 text-lg sm:text-xl font-mono uppercase"
              placeholder="e.g. UG24SEN1051, 2024/12345"
              autoComplete="off"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1 break-words">
              Enter your registration number (any format accepted)
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 sm:py-5 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : !canSubmit ? (
              shouldRequireLocation && !location ? '📍 Waiting for location...' : '✅ Submit Attendance'
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                ✅ Submit Attendance
              </>
            )}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
            🔒 <strong>Secure Submission:</strong> One submission per device. Location and device verification required.
          </p>
        </div>
      </div>
    </div>
  );
}