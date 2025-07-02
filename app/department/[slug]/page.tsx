'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, Calendar, Wrench } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

export default function DepartmentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoadingDept, setIsLoadingDept] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (params.slug) {
      fetchDepartment();
    }
  }, [params.slug]);

  const fetchDepartment = async () => {
    try {
      setIsLoadingDept(true);
      const deptName = (params.slug as string).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .ilike('name', `%${deptName}%`)
        .maybeSingle();

      if (error) throw error;
      setDepartment(data);
    } catch (error) {
      console.error('Error fetching department:', error);
    } finally {
      setIsLoadingDept(false);
    }
  };

  if (isLoading || isLoadingDept) {
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

  if (!department) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="p-6 lg:p-8 pt-16 lg:pt-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Department Not Found</h1>
              <p className="text-gray-600 mt-2">The requested department could not be found.</p>
              <Button onClick={() => router.push('/dashboard')} className="mt-4">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const hasAccess = user.departments?.includes(department.name) || user.is_admin;

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
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Database className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {department.name}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {department.description || 'Department data management tools coming soon to the OAG Data Portal.'}
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
                    We're building comprehensive data management tools for this department
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Planned Features</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Data management interface</li>
                        <li>• Search and filtering</li>
                        <li>• Document management</li>
                        <li>• Analytics and reporting</li>
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
                        <h4 className="font-medium text-blue-900 mb-1">Development Status</h4>
                        <p className="text-sm text-blue-800">
                          This department module is in our development pipeline. Data management tools 
                          will be built based on department-specific requirements and workflows.
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