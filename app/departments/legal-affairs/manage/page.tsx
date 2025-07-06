'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalAffairsManagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to existing government cases page for now
    // This will be replaced with the actual legal affairs management interface
    router.replace('/government-cases');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to government cases...</p>
      </div>
    </div>
  );
}