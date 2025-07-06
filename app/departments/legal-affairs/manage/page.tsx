'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalAffairsManagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the old government-cases page temporarily
    // This provides backward compatibility while we migrate
    router.replace('/government-cases');
  }, [router]);

  return null;
}