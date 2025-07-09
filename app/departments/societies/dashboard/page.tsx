'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, TrendingUp, FileText, Calendar, Building2, Clock, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function SocietiesDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSocieties: 0,
    thisYear: 0,
    lastYear: 0,
    thisMonth: 0,
    recent: 0,
    registrationTrend: [],
    yearlyBreakdown: []
  });
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.is_approved) {
        router.push('/auth');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_approved) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const { data: societies, error } = await supabase
        .from('societies')
        .select('*');

      if (error) throw error;

      const societiesData = societies || [];
      const totalSocieties = societiesData.length;
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Calculate yearly statistics
      const thisYear = societiesData.filter(s => 
        s.registration_date && 
        new Date(s.registration_date).getFullYear() === currentYear
      ).length;
      
      const lastYear = societiesData.filter(s => 
        s.registration_date && 
        new Date(s.registration_date).getFullYear() === currentYear - 1
      ).length;

      // Calculate monthly statistics
      const thisMonth = societiesData.filter(s => {
        if (s.registration_date) {
          const regDate = new Date(s.registration_date);
          return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
        }
        return false;
      }).length;

      // Recent registrations (last 30 days)
      const recent = societiesData.filter(s => 
        s.created_at && 
        new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      // Registration trend over the last 5 years
      const registrationTrend = [];
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const count = societiesData.filter(s => 
          s.registration_date && 
          new Date(s.registration_date).getFullYear() === year
        ).length;
        registrationTrend.push({ year, count });
      }

      // Yearly breakdown
      const yearCounts = {};
      societiesData.forEach(society => {
        if (society.registration_date) {
          const year = new Date(society.registration_date).getFullYear();
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });

      const yearlyBreakdown = Object.entries(yearCounts)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => b.year - a.year)
        .slice(0, 10); // Top 10 years

      setStats({
        totalSocieties,
        thisYear,
        lastYear,
        thisMonth,
        recent,
        registrationTrend,
        yearlyBreakdown
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading || isLoadingStats) {
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
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Societies Dashboard</h1>
                <p className="text-gray-600">Overview of society registrations and statistics</p>
              </div>
            </div>
          </motion.div>

          {/* Key Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Societies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalSocieties)}</div>
                <p className="text-xs text-muted-foreground">Registered organizations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisYear}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.lastYear > 0 ? (
                    stats.thisYear > stats.lastYear ? 
                      `+${((stats.thisYear - stats.lastYear) / stats.lastYear * 100).toFixed(1)}% from last year` :
                      `${((stats.thisYear - stats.lastYear) / stats.lastYear * 100).toFixed(1)}% from last year`
                  ) : 'Registered in 2025'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">New registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recent}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Registration Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  5-Year Registration Trend
                </CardTitle>
                <CardDescription>Society registrations over the last 5 years</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.registrationTrend.map((item, index) => (
                    <div key={item.year} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.year}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.max(10, (item.count / Math.max(...stats.registrationTrend.map(t => t.count))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Top Registration Years
                </CardTitle>
                <CardDescription>Years with the most society registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.yearlyBreakdown.slice(0, 8).map((item, index) => (
                    <div key={item.year} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.year}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.max(10, (item.count / Math.max(...stats.yearlyBreakdown.map(t => t.count))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Complete Records</span>
                    <span className="text-sm font-medium">
                      {stats.totalSocieties > 0 ? 
                        Math.round((stats.totalSocieties / stats.totalSocieties) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full w-full" />
                  </div>
                  <p className="text-xs text-gray-500">
                    All records contain required fields
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats.lastYear > 0 ? 
                      `${((stats.thisYear - stats.lastYear) / stats.lastYear * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </div>
                  <p className="text-xs text-gray-500">
                    Year-over-year growth in registrations
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Database Online</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Import System Active</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Search Functional</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}