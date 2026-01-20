"use client";

import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    university: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [oauthEmail, setOauthEmail] = useState('');

  // Complete list of Nigerian university departments
  const departments = [
    // Sciences
    'Computer Science',
    'Mathematics',
    'Statistics',
    'Physics',
    'Chemistry', 
    'Biology',
    'Biochemistry',
    'Microbiology',
    'Botany',
    'Zoology',
    'Geology',
    'Geography',
    'Environmental Science',
    
    // Engineering
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Petroleum Engineering',
    'Computer Engineering',
    'Agricultural Engineering',
    'Structural Engineering',
    'Systems Engineering',
    'Marine Engineering',
    'Metallurgical Engineering',
    'Industrial Engineering',
    
    // Medical & Health Sciences
    'Medicine & Surgery',
    'Nursing',
    'Pharmacy',
    'Dentistry',
    'Veterinary Medicine',
    'Medical Laboratory Science',
    'Physiotherapy',
    'Radiography',
    'Public Health',
    'Anatomy',
    'Physiology',
    
    // Social Sciences
    'Economics',
    'Political Science',
    'Sociology',
    'Psychology',
    'Social Work',
    'Mass Communication',
    'International Relations',
    'Public Administration',
    'Criminology',
    
    // Arts & Humanities
    'English',
    'History',
    'Philosophy',
    'Religious Studies',
    'Linguistics',
    'Foreign Languages',
    'Arabic Studies',
    'Islamic Studies',
    'Christian Religious Studies',
    'Fine Arts',
    'Music',
    'Theatre Arts',
    
    // Management Sciences
    'Business Administration',
    'Accounting',
    'Banking & Finance',
    'Marketing',
    'Insurance',
    'Human Resource Management',
    'Entrepreneurship',
    'Business Management',
    
    // Education
    'Education & Biology',
    'Education & Chemistry',
    'Education & Mathematics',
    'Education & Physics',
    'Education & English',
    'Educational Administration',
    'Guidance & Counselling',
    'Primary Education',
    'Early Childhood Education',
    'Adult Education',
    
    // Law
    'Law',
    'Common Law',
    'Islamic Law',
    
    // Agriculture
    'Agriculture',
    'Agricultural Economics',
    'Animal Science',
    'Crop Science',
    'Soil Science',
    'Forestry',
    'Fisheries',
    'Food Science & Technology',
    
    // Environmental Sciences
    'Architecture',
    'Estate Management',
    'Urban & Regional Planning',
    'Surveying & Geoinformatics',
    'Building Technology',
    'Quantity Surveying',
    
    // Other
    'Library Science',
    'Information Technology',
    'Cyber Security',
    'Software Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Other'
  ].sort();

  const providerInfo = {
    google: {
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    microsoft: {
      name: 'Microsoft',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 23 23">
          <path fill="#f35325" d="M0 0h11v11H0z"/>
          <path fill="#81bc06" d="M12 0h11v11H12z"/>
          <path fill="#05a6f0" d="M0 12h11v11H0z"/>
          <path fill="#ffba08" d="M12 12h11v11H12z"/>
        </svg>
      )
    },
    facebook: {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877f2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  };

  const handleOAuthClick = (provider) => {
    setSelectedProvider(provider);
    setShowOAuthModal(true);
    setOauthEmail('');
  };

  const handleOAuthRegister = async () => {
    if (!oauthEmail || !oauthEmail.includes('@')) {
      setErrors({ oauth: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: oauthEmail.split('@')[0].replace(/[._]/g, ' '),
          email: oauthEmail,
          password: Math.random().toString(36).slice(-12),
          department: 'Not specified',
          university: '',
          oauthProvider: selectedProvider
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setErrors({ oauth: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ oauth: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          university: formData.university
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful! 🎉</h2>
          <p className="text-gray-600 mb-6">Redirecting to login...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Lecturer Account</h1>
          <p className="text-gray-600">Smart Attendance System</p>
        </div>

        {errors.submit && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuthClick('google')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.google.icon}
            <span>Register with Google</span>
            <span className="text-green-600">⚡</span>
          </button>

          <button
            onClick={() => handleOAuthClick('microsoft')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.microsoft.icon}
            <span>Register with Microsoft</span>
            <span className="text-blue-600">⚡</span>
          </button>

          <button
            onClick={() => handleOAuthClick('facebook')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.facebook.icon}
            <span>Register with Facebook</span>
            <span className="text-indigo-600">⚡</span>
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or use email & password</span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">👤 Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dr. Abubakar Mohammed"
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">📧 Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="lecturer@university.edu.ng"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">🔒 Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">🔒 Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">📚 Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                errors.department ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Your Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">🏫 University (Optional)</label>
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="Ahmadu Bello University"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : '🎓 Create Lecturer Account'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">Login here</a>
          </p>
        </div>
      </div>

      {showOAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <div className="bg-white rounded-full p-2">
                  {providerInfo[selectedProvider].icon}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Register with {providerInfo[selectedProvider].name}
              </h2>
              <p className="text-gray-600 text-sm">Enter your {providerInfo[selectedProvider].name} email</p>
            </div>

            {errors.oauth && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-sm text-red-700">{errors.oauth}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={oauthEmail}
                onChange={(e) => setOauthEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="your.email@gmail.com"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Use your {providerInfo[selectedProvider].name} email address
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOAuthModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleOAuthRegister}
                disabled={loading || !oauthEmail}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}