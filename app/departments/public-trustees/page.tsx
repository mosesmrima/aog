'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Scale, 
  Users, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  BarChart3,
  FileText,
  ArrowRight,
  Plus,
  Download,
  Upload,
  Eye,
  Search,
  User,
  Clock,
  Heart,
  Building
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function PublicTrusteesDepartmentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalTrustees: 0,
    maleCount: 0,
    femaleCount: 0,
    thisYear: 0,
    avgPerYear: 0,
    topCounty: 'Loading...',
    earliestYear: 0,
    latestYear: 0,
    recentRecords: 0,
    avgQuality: 0
  });

  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      
      // Get basic statistics
      const { data: countData } = await supabase
        .from('public_trustees')
        .select('gender, file_year, county, date_of_death, data_quality_score, created_at', { count: 'exact' });
        
      if (countData) {
        const totalTrustees = countData.length;
        const maleCount = countData.filter(t => t.gender === 'MALE').length;
        const femaleCount = countData.filter(t => t.gender === 'FEMALE').length;
        
        const currentYear = new Date().getFullYear();
        const thisYear = countData.filter(t => t.file_year === currentYear).length;
        
        const years = countData.map(t => t.file_year).filter(y => y);
        const earliestYear = Math.min(...years);
        const latestYear = Math.max(...years);
        const yearRange = latestYear - earliestYear + 1;
        const avgPerYear = yearRange > 0 ? Math.round(totalTrustees / yearRange) : 0;
        
        // Get top county
        const countyCount = countData.reduce((acc, trustee) => {
          if (trustee.county) {
            acc[trustee.county] = (acc[trustee.county] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const topCounty = Object.entries(countyCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        
        // Recent records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRecords = countData.filter(t => 
          new Date(t.created_at) >= thirtyDaysAgo
        ).length;
        
        // Average quality score
        const qualityScores = countData.map(t => t.data_quality_score || 0);
        const avgQuality = qualityScores.length > 0 
          ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) 
          : 0;
        
        setStats({
          totalTrustees,
          maleCount,
          femaleCount,
          thisYear,
          avgPerYear,
          topCounty,
          earliestYear,
          latestYear,
          recentRecords,
          avgQuality
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast({
        title: "Error Loading Statistics",
        description: "Could not load department statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else if (!user.is_approved) {
        router.push('/pending');
      } else {
        loadStats();
      }
    }
  }, [user, isLoading, router, loadStats]);

  const quickActions = [
    {
      name: 'Manage Records',
      description: 'View and manage all trustee records',
      icon: FileText,
      href: '/departments/public-trustees/manage',
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Import CSV',
      description: 'Upload new trustee data from CSV files',
      icon: Upload,
      href: '/departments/public-trustees/manage',
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Public Registry',
      description: 'View the public trustees registry',
      icon: Search,
      href: '/registries/public-trustees',
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: BarChart3,
      href: '/departments/public-trustees/analytics',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const recentActivity = [
    { action: 'CSV Import', details: 'Imported 150 records from PT FILES 2024.csv', time: '2 hours ago' },
    { action: 'Record Update', details: 'Updated beneficiary information for PT/45/2024', time: '4 hours ago' },
    { action: 'Public Search', details: '23 public searches performed today', time: '6 hours ago' },
    { action: 'Data Quality', details: 'Quality score improved to 85% average', time: '1 day ago' }
  ];

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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Public Trustees Department</h1>
                  <p className="text-gray-600">Manage deceased estates and public trustee records</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link href="/departments/public-trustees/manage">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Records
                  </Button>
                </Link>
                <Link href="/registries/public-trustees">
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    Public Registry
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Statistics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-700">Total Records</div>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {isLoadingStats ? '...' : stats.totalTrustees.toLocaleString()}
                </div>
                <p className="text-sm text-blue-600">
                  {stats.earliestYear} - {stats.latestYear}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-700">Gender Distribution</div>
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {isLoadingStats ? '...' : Math.round((stats.maleCount / stats.totalTrustees) * 100)}%M
                </div>
                <p className="text-sm text-green-600">
                  {stats.maleCount} male, {stats.femaleCount} female
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-700">Top County</div>
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-purple-900 truncate">
                  {isLoadingStats ? '...' : stats.topCounty}
                </div>
                <p className="text-sm text-purple-600">
                  Most estates recorded
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-amber-700">Data Quality</div>
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-bold text-amber-900">
                  {isLoadingStats ? '...' : stats.avgQuality}%
                </div>
                <p className="text-sm text-amber-600">
                  Average quality score
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks and operations for public trustees management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <Link key={action.name} href={action.href}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mr-3`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{action.name}</div>
                            <div className="text-sm text-gray-500">{action.description}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest activities and updates in the public trustees system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{activity.action}</div>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                          <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rose-700">This Year</div>
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-3xl font-bold text-rose-900">
                  {isLoadingStats ? '...' : stats.thisYear}
                </div>
                <p className="text-sm text-rose-600">
                  New records in {new Date().getFullYear()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-teal-700">Annual Average</div>
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-3xl font-bold text-teal-900">
                  {isLoadingStats ? '...' : stats.avgPerYear}
                </div>
                <p className="text-sm text-teal-600">
                  Records per year
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-violet-700">Recent Activity</div>
                  <Clock className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-3xl font-bold text-violet-900">
                  {isLoadingStats ? '...' : stats.recentRecords}
                </div>
                <p className="text-sm text-violet-600">
                  Records added (30 days)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}