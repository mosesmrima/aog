'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SocietiesManagePage() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to a placeholder or show message
    // This will be replaced with the actual societies management interface
    // when the societies data management system is implemented
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}