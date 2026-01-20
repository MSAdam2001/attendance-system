// app/page.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const lecturer = localStorage.getItem('lecturer');
      
      if (token && lecturer) {
        router.push('/dashboard');
      } else {
        router.push('/register');
      }
    };

    // Small delay to prevent flash
    setTimeout(() => {
      checkAuth();
      setChecking(false);
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    </div>
  );
}
