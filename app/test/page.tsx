'use client';

import { SupabaseTest } from '@/components/debug/supabase-test';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Supabase Connection Test</h1>
        <SupabaseTest />
      </div>
    </div>
  );
}