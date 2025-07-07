'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, TrendingUp, FileText, Calendar, Building2, Clock, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function SocietiesDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSocieties: 0,
    activeSocieties: 0,
    exemptedSocieties: 0,
    totalMembers: 0,
    thisMonth: 0,
    avgProcessingTime: '2-4 weeks',
    societyTypes: [],
    dataSources: [],
    recentRegistrations: []
  });
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else if (!user.is_approved) {
        router.push('/pending');
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
      const { data: societies, error } = await supabase
        .from('societies')
        .select('*');

      if (error) throw error;

      const societiesData = societies || [];
      const totalSocieties = societiesData.length;
      
      // Count active vs exempted societies
      const exemptedSocieties = societiesData.filter(s => 
        s.exemption_number || s.data_source === 'exempted_societies'
      ).length;
      const activeSocieties = totalSocieties - exemptedSocieties;

      // Calculate total members
      const totalMembers = societiesData.reduce((sum, society) => {
        return sum + (society.member_count || 0);
      }, 0);

      // Societies registered this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = societiesData.filter(s => {
        if (s.created_at) {
          const createdDate = new Date(s.created_at);
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }
        return false;
      }).length;

      // Analyze society types
      const typeCounts = {};
      societiesData.forEach(society => {
        if (society.nature_of_society && typeof society.nature_of_society === 'string') {
          const type = society.nature_of_society.trim().toUpperCase();
          if (type) {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        }
      });
      
      const societyTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: ((count / totalSocieties) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze data sources
      const sourceCounts = {};
      societiesData.forEach(society => {
        if (society.data_source && typeof society.data_source === 'string') {
          const source = society.data_source.trim();
          if (source) {
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
          }
        }
      });
      
      const dataSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({
          source,
          count,
          percentage: ((count / totalSocieties) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);

      // Get recent registrations
      const recentRegistrations = societiesData
        .filter(s => s.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalSocieties,
        activeSocieties,
        exemptedSocieties,
        totalMembers,
        thisMonth,
        avgProcessingTime: '2-4 weeks',
        societyTypes,
        dataSources,
        recentRegistrations
      });
    } catch (error) {
      console.error('Error loading societies stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

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
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Registrar of Societies</h1>
                <p className="text-gray-600">Society registration and management analytics</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Societies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalSocieties}
                </div>
                <p className="text-xs text-muted-foreground">All registered societies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Societies</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.activeSocieties}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.thisMonth}
                </div>
                <p className="text-xs text-muted-foreground">New registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : formatLargeNumber(stats.totalMembers)}
                </div>
                <p className="text-xs text-muted-foreground">Across all societies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exempted</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.exemptedSocieties}
                </div>
                <p className="text-xs text-muted-foreground">Exempted societies</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts and Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Society Types Distribution</CardTitle>
                <CardDescription>Breakdown by nature of society</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.societyTypes.length > 0 ? (
                    stats.societyTypes.map((type, index) => (
                      <div key={type.type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type.type}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-blue-500' : 
                                index === 1 ? 'bg-green-500' : 
                                index === 2 ? 'bg-purple-500' : 
                                index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${type.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{type.count} ({type.percentage}%)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {isLoadingStats ? 'Loading society types...' : 'No society type data available'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>Registration data by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.dataSources.length > 0 ? (
                    stats.dataSources.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {source.source.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-indigo-500' : 
                                index === 1 ? 'bg-pink-500' : 
                                index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.min(source.percentage * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{source.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {isLoadingStats ? 'Loading data sources...' : 'No data source information available'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest society registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentRegistrations.length > 0 ? (
                    stats.recentRegistrations.map((society, index) => (
                      <div key={society.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">
                            {society.society_name || 'Unnamed Society'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {society.nature_of_society || 'Unknown Type'} • {' '}
                            {society.created_at ? new Date(society.created_at).toLocaleDateString() : 'Unknown Date'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {isLoadingStats ? 'Loading recent activity...' : 'No recent registrations'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Key performance indicators and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Registration Completion Rate</span>
                      <span>{stats.totalSocieties > 0 ? ((stats.activeSocieties / stats.totalSocieties) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ 
                        width: `${stats.totalSocieties > 0 ? (stats.activeSocieties / stats.totalSocieties) * 100 : 0}%` 
                      }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Quality Score</span>
                      <span>87.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87.3%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Growth</span>
                      <span>+{stats.thisMonth}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Avg. Processing Time: {stats.avgProcessingTime}</span>
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
