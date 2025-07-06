'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { AdministrationAnalytics } from '@/components/departments/administration-analytics';
import { useAuth } from '@/components/providers/auth-provider';

export default function AdministrationDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else if (!user.is_approved) {
        router.push('/pending');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || !user.is_approved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Administration Dashboard</h1>
                <p className="text-gray-600">
                  System administration and user management
                </p>
              </div>
            </div>
          </motion.div>

          <AdministrationAnalytics />
        </div>
      </main>
    </div>
  );
}
