'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Calendar, Wrench } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

export default function SocietiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
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

  const hasAccess = user.departments?.includes('Registrar of Societies') || user.is_admin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Registrar of Societies
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Society registrations, compliance management, and regulatory oversight coming soon to the OAG Data Portal.
                </p>
              </div>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">Under Development</CardTitle>
                  <CardDescription className="text-gray-600">
                    We're building a comprehensive solution for society management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Planned Features</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Society registration management</li>
                        <li>• Compliance tracking</li>
                        <li>• Document management</li>
                        <li>• Renewal notifications</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Your Access</h3>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>View Access:</span>
                          <span className="text-green-600 font-medium">✓ Granted</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Edit Access:</span>
                          <span className={hasAccess ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                            {hasAccess ? "✓ Granted" : "⏳ Department Required"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Development Timeline</h4>
                        <p className="text-sm text-blue-800">
                          This module is scheduled for development in Phase 2 of the OAG Data Portal expansion. 
                          We'll notify all users when it becomes available.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={() => router.push('/dashboard')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}