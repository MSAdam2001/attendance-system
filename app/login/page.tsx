"use client";

import { useState, useEffect } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [oauthEmail, setOauthEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const lecturer = localStorage.getItem('lecturer');
    
    if (token && lecturer) {
      window.location.href = '/dashboard';
    }
  }, []);

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
    setError('');
  };

  const handleOAuthLogin = async () => {
    if (!oauthEmail || !oauthEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: oauthEmail,
          provider: selectedProvider
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('lecturer', JSON.stringify(data.lecturer));
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('lecturer', JSON.stringify(data.lecturer));
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Attendance</h1>
          <p className="text-gray-600">Universal Attendance System</p>
          <p className="text-sm text-gray-500 mt-1">For Schools, Colleges & Universities</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuthClick('google')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.google.icon}
            <span>Continue with Google</span>
            <span className="text-green-600">⚡</span>
          </button>

          <button
            onClick={() => handleOAuthClick('microsoft')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.microsoft.icon}
            <span>Continue with Microsoft</span>
            <span className="text-blue-600">⚡</span>
          </button>

          <button
            onClick={() => handleOAuthClick('facebook')}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {providerInfo.facebook.icon}
            <span>Continue with Facebook</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">📧 Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition"
              placeholder="lecturer@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">🔒 Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">Remember me</label>
            </div>
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
               Forgot password?
             </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
          >
            {loading ? '🔄 Logging in...' : '🔐 Login with Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-800 font-semibold underline">
              Register as a Lecturer
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3">
            <span>Secure • Fast • Universal</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            📚 Students: Click the attendance link shared by your lecturer
          </p>
        </div>
      </div>

      {showOAuthModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <div className="bg-white rounded-full p-2">
                  {providerInfo[selectedProvider].icon}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sign in with {providerInfo[selectedProvider].name}
              </h2>
              <p className="text-gray-600 text-sm">Enter your {providerInfo[selectedProvider].name} email</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={oauthEmail}
                onChange={(e) => setOauthEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleOAuthLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="your.email@gmail.com"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Use the {providerInfo[selectedProvider].name} email you registered with
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOAuthModal(false);
                  setError('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleOAuthLogin}
                disabled={loading || !oauthEmail}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}