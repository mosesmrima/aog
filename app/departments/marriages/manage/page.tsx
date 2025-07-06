'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarriagesManagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to existing marriages page for now
    // This will be replaced with the actual management interface
    router.replace('/marriages');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to marriage management...</p>
      </div>
    </div>
  );
}