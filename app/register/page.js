"use client";

import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    department: '',
    customFaculty: '',
    customDepartment: '',
    university: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [oauthEmail, setOauthEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nigerian Universities Faculties and Departments
  const facultiesAndDepartments = {
    'Medicine & Health Sciences': [
      'Medicine & Surgery',
      'Nursing Science',
      'Pharmacy',
      'Dentistry',
      'Veterinary Medicine',
      'Medical Laboratory Science',
      'Physiotherapy',
      'Radiography',
      'Public Health',
      'Anatomy',
      'Physiology',
      'Pharmacology',
      'Medical Biochemistry',
      'Clinical Psychology',
      'Other (Specify)'
    ],
    'Engineering & Technology': [
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical & Electronics Engineering',
      'Chemical Engineering',
      'Petroleum Engineering',
      'Computer Engineering',
      'Agricultural Engineering',
      'Structural Engineering',
      'Systems Engineering',
      'Marine Engineering',
      'Metallurgical & Materials Engineering',
      'Industrial & Production Engineering',
      'Mechatronics Engineering',
      'Biomedical Engineering',
      'Aerospace Engineering',
      'Other (Specify)'
    ],
    'Sciences': [
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
      'Geophysics',
      'Geography',
      'Environmental Science',
      'Marine Biology',
      'Biotechnology',
      'Industrial Chemistry',
      'Applied Physics',
      'Other (Specify)'
    ],
    'Social Sciences': [
      'Economics',
      'Political Science',
      'Sociology',
      'Psychology',
      'Social Work',
      'Mass Communication',
      'International Relations',
      'Public Administration',
      'Criminology & Security Studies',
      'Industrial Relations',
      'Demography & Social Statistics',
      'Peace & Conflict Studies',
      'Development Studies',
      'Other (Specify)'
    ],
    'Arts & Humanities': [
      'English Language & Literature',
      'History & International Studies',
      'Philosophy',
      'Religious Studies',
      'Linguistics',
      'French',
      'Arabic',
      'Hausa',
      'Igbo',
      'Yoruba',
      'Islamic Studies',
      'Christian Religious Studies',
      'Fine Arts',
      'Music',
      'Theatre Arts',
      'Languages & Linguistics',
      'Other (Specify)'
    ],
    'Management Sciences': [
      'Business Administration',
      'Accounting',
      'Banking & Finance',
      'Marketing',
      'Insurance',
      'Human Resource Management',
      'Entrepreneurship',
      'Business Management',
      'Actuarial Science',
      'Taxation',
      'Other (Specify)'
    ],
    'Education': [
      'Education & Biology',
      'Education & Chemistry',
      'Education & Mathematics',
      'Education & Physics',
      'Education & English',
      'Education & Economics',
      'Educational Administration & Planning',
      'Guidance & Counselling',
      'Primary Education Studies',
      'Early Childhood Education',
      'Adult Education',
      'Educational Technology',
      'Library & Information Science',
      'Physical & Health Education',
      'Other (Specify)'
    ],
    'Law': [
      'Common Law',
      'Islamic Law',
      'Commercial Law',
      'International Law',
      'Other (Specify)'
    ],
    'Agriculture': [
      'Agricultural Economics & Extension',
      'Animal Science',
      'Crop Science',
      'Soil Science',
      'Forestry & Wildlife',
      'Fisheries & Aquaculture',
      'Food Science & Technology',
      'Agricultural Engineering',
      'Home Economics',
      'Other (Specify)'
    ],
    'Environmental Design': [
      'Architecture',
      'Estate Management',
      'Urban & Regional Planning',
      'Surveying & Geoinformatics',
      'Building Technology',
      'Quantity Surveying',
      'Other (Specify)'
    ],
    'Pharmaceutical Sciences': [
      'Pharmacy',
      'Pharmacology',
      'Clinical Pharmacy',
      'Industrial Pharmacy',
      'Pharmaceutical Chemistry',
      'Other (Specify)'
    ],
    'Other (Specify)': [
      'Other (Specify)'
    ]
  };

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
          faculty: 'Not specified',
          department: 'Not specified',
          university: '',
          oauthProvider: selectedProvider
        })
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login: Store credentials immediately
        localStorage.setItem('token', data.token);
        localStorage.setItem('lecturer', JSON.stringify(data.lecturer));
        
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';  // Changed from '/login' to '/dashboard'
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

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.faculty) {
      newErrors.faculty = 'Please select a faculty';
    }

    if (formData.faculty === 'Other (Specify)' && !formData.customFaculty.trim()) {
      newErrors.customFaculty = 'Please specify your faculty';
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    if (formData.department === 'Other (Specify)' && !formData.customDepartment.trim()) {
      newErrors.customDepartment = 'Please specify your department';
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
          faculty: formData.faculty === 'Other (Specify)' ? formData.customFaculty : formData.faculty,
          department: formData.department === 'Other (Specify)' ? formData.customDepartment : formData.department,
          university: formData.university
        })
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login: Store credentials immediately
        localStorage.setItem('token', data.token);
        localStorage.setItem('lecturer', JSON.stringify(data.lecturer));
        
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';  // Changed from '/login' to '/dashboard'
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
    
    // Reset department when faculty changes
    if (name === 'faculty') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        department: '',
        customDepartment: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center border border-emerald-100">
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-14 h-14 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Welcome Aboard! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-8">Your lecturer account has been created successfully</p>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
            <p className="text-emerald-600 font-semibold">Taking you to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-3xl w-full border border-slate-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Lecturer Registration
          </h1>
          <p className="text-slate-600 text-lg">Join our Smart Attendance Platform</p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuthClick('google')}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-semibold hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {providerInfo.google.icon}
            <span>Continue with Google</span>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <button
            onClick={() => handleOAuthClick('microsoft')}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-semibold hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {providerInfo.microsoft.icon}
            <span>Continue with Microsoft</span>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <button
            onClick={() => handleOAuthClick('facebook')}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-semibold hover:border-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {providerInfo.facebook.icon}
            <span>Continue with Facebook</span>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Rest of your form code stays exactly the same... */}
        {/* I'm including the complete form for completeness but it's unchanged */}
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-slate-500 font-medium">Or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* All your form fields remain exactly the same - I'm keeping them for completeness */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                  errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="Dr. Abubakar Mohammed"
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Continue with all other form fields exactly as they were... */}
          {/* For brevity, I'll note that ALL your existing form code stays the same */}
          {/* Only the handleSubmit and handleOAuthRegister functions changed */}

          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="lecturer@university.edu.ng"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password fields, faculty/department selectors, university field, and submit button all remain unchanged */}
          {/* I'm keeping the complete code but noting that these sections are identical to your original */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Password strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.strength ? passwordStrength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                    errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Faculty and Department fields remain unchanged... continuing with all your existing code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Faculty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 appearance-none ${
                    errors.faculty ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Faculty</option>
                  {Object.keys(facultiesAndDepartments).map(faculty => (
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.faculty && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.faculty}
                </p>
              )}
              
              {formData.faculty === 'Other (Specify)' && (
                <div className="mt-3">
                  <input
                    type="text"
                    name="customFaculty"
                    value={formData.customFaculty}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                      errors.customFaculty ? 'border-red-500 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="Specify Faculty *"
                  />
                  {errors.customFaculty && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.customFaculty}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!formData.faculty}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.department ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                >
                  <option value="">
                    {formData.faculty ? 'Select Department' : 'Select Faculty First'}
                  </option>
                  {formData.faculty && facultiesAndDepartments[formData.faculty]?.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.department && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.department}
                </p>
              )}
              
              {formData.department === 'Other (Specify)' && (
                <div className="mt-3">
                  <input
                    type="text"
                    name="customDepartment"
                    value={formData.customDepartment}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400 ${
                      errors.customDepartment ? 'border-red-500 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="Specify Department *"
                  />
                  {errors.customDepartment && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.customDepartment}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm">
              University <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400"
                placeholder="e.g., Ahmadu Bello University"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Your Account...</span>
              </>
            ) : (
              <>
                <span>Create Lecturer Account</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>

      {showOAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="bg-white rounded-xl p-2">
                  {providerInfo[selectedProvider].icon}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Continue with {providerInfo[selectedProvider].name}
              </h2>
              <p className="text-slate-600">Enter your {providerInfo[selectedProvider].name} email to register</p>
            </div>

            {errors.oauth && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-sm text-red-700">{errors.oauth}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={oauthEmail}
                onChange={(e) => setOauthEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder-slate-400"
                placeholder="your.email@gmail.com"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                We'll use this email to create your lecturer account
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOAuthModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleOAuthRegister}
                disabled={loading || !oauthEmail}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}