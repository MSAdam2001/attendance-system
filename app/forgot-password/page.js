"use client";

import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter Code, 3: Reset Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Reset code sent! Code: ${data.code} (Check console for development)`);
        console.log('🔑 Reset Code:', data.code); // For development
        setStep(2);
      } else {
        setError(data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Code verified! Enter your new password.');
        setStep(3);
      } else {
        setError(data.message || 'Invalid reset code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Smart Attendance System</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Email</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Code</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Reset</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700 font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                📧 Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="lecturer@university.edu"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send a reset code to this email address
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
            >
              {loading ? '⏳ Sending...' : '📨 Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Enter Reset Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                🔑 Reset Code
              </label>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength="6"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
            >
              {loading ? '⏳ Verifying...' : '✓ Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to email
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                🔒 New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                🔒 Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
            >
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}