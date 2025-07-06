'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdministrationManagePage() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to admin panel for administration management
    // This provides access to user management and system administration features
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to admin panel...</p>
      </div>
    </div>
  );
}