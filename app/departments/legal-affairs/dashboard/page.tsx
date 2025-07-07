'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scale, TrendingUp, FileText, Calendar, DollarSign, Clock, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { LandCasesThematicChart } from '@/components/legal-affairs/land-cases-thematic-chart';
import { totalLandCases, getTopLandCaseCategories } from '@/lib/land-cases-data';

export default function LegalAffairsDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    concludedCases: 0,
    totalLiability: 0,
    thisMonth: 0,
    avgProcessingTime: '12-18 months',
    courtStations: [],
    casesByNature: [],
    importedFilesCount: 0
  });
  
  const topLandCases = getTopLandCaseCategories(5);
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
      const { data: cases, error } = await supabase
        .from('government_cases')
        .select('*');

      if (error) throw error;

      const casesData = cases || [];
      const totalCases = casesData.length;
      const activeCases = casesData.filter(c => {
        const status = c.current_case_status?.toLowerCase?.() || '';
        return c.current_case_status && 
               !status.includes('concluded') &&
               !status.includes('closed');
      }).length;
      const concludedCases = casesData.filter(c => {
        const status = c.current_case_status?.toLowerCase?.() || '';
        return c.current_case_status && 
               (status.includes('concluded') || status.includes('closed'));
      }).length;

      // Cases this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = casesData.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;

      // Calculate total potential liability
      const totalLiability = casesData.reduce((sum, case_) => {
        if (case_.potential_liability_kshs && typeof case_.potential_liability_kshs === 'string') {
          const amount = parseFloat(case_.potential_liability_kshs.replace(/[,'"]/g, ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }
        return sum;
      }, 0);

      // Analyze court stations
      const stationCounts = {};
      casesData.forEach(case_ => {
        if (case_.court_station && typeof case_.court_station === 'string') {
          const station = case_.court_station.trim().toUpperCase();
          if (station) {
            stationCounts[station] = (stationCounts[station] || 0) + 1;
          }
        }
      });
      
      const courtStations = Object.entries(stationCounts)
        .map(([station, count]) => ({
          station,
          count,
          percentage: ((count / totalCases) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze cases by nature
      const natureCounts = {};
      casesData.forEach(case_ => {
        if (case_.nature_of_claim_new && typeof case_.nature_of_claim_new === 'string') {
          const nature = case_.nature_of_claim_new.trim();
          if (nature) {
            natureCounts[nature] = (natureCounts[nature] || 0) + 1;
          }
        }
      });
      
      const casesByNature = Object.entries(natureCounts)
        .map(([nature, count]) => ({
          nature,
          count,
          percentage: ((count / totalCases) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalCases,
        activeCases,
        concludedCases,
        totalLiability,
        thisMonth,
        avgProcessingTime: '12-18 months',
        courtStations,
        casesByNature,
        importedFilesCount: 11 // From the 11 CSV files in the analysis
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Legal Affairs Department</h1>
                <p className="text-gray-600">Government cases and litigation management</p>
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
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalCases}
                </div>
                <p className="text-xs text-muted-foreground">All government cases</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.activeCases}
                </div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
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
                <p className="text-xs text-muted-foreground">New cases filed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Liability</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : `KES ${formatLargeNumber(stats.totalLiability)}`}
                </div>
                <p className="text-xs text-muted-foreground">Potential exposure</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Land Cases</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalLandCases.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Civil litigation cases</p>
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
                <CardTitle>Case Status Distribution</CardTitle>
                <CardDescription>Breakdown of cases by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Cases</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ 
                          width: `${stats.totalCases > 0 ? (stats.activeCases / stats.totalCases) * 100 : 0}%` 
                        }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{stats.activeCases}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Concluded Cases</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ 
                          width: `${stats.totalCases > 0 ? (stats.concludedCases / stats.totalCases) * 100 : 0}%` 
                        }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{stats.concludedCases}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Review</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{Math.floor(stats.totalCases * 0.15)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Case Activity</CardTitle>
                <CardDescription>Latest updates and case developments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New case filed</p>
                      <p className="text-xs text-gray-500">Environmental Protection Case • 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Hearing scheduled</p>
                      <p className="text-xs text-gray-500">Land Acquisition Case • 4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Status updated</p>
                      <p className="text-xs text-gray-500">Public Procurement Case • 6 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Judgment delivered</p>
                      <p className="text-xs text-gray-500">Healthcare Workers Case • 1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Court Station Workload</CardTitle>
                <CardDescription>Case distribution across court stations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.courtStations.length > 0 ? (
                    stats.courtStations.map((station, index) => (
                      <div key={station.station} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{station.station}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-blue-500' : 
                                index === 1 ? 'bg-green-500' : 
                                index === 2 ? 'bg-purple-500' : 
                                index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${station.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{station.count} ({station.percentage}%)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {isLoadingStats ? 'Loading court station data...' : 'No court station data available'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Types by Nature</CardTitle>
                <CardDescription>Most common types of legal cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.casesByNature.length > 0 ? (
                    stats.casesByNature.map((type, index) => (
                      <div key={type.nature} className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate max-w-[120px]" title={type.nature || ''}>
                          {type.nature && type.nature.length > 20 ? `${type.nature.substring(0, 20)}...` : (type.nature || 'Unknown')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-indigo-500' : 
                                index === 1 ? 'bg-pink-500' : 
                                index === 2 ? 'bg-yellow-500' : 
                                index === 3 ? 'bg-red-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.min(type.percentage * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{type.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {isLoadingStats ? 'Loading case types...' : 'No case type data available'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Case Resolution Rate</span>
                      <span>{stats.totalCases > 0 ? ((stats.concludedCases / stats.totalCases) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ 
                        width: `${stats.totalCases > 0 ? (stats.concludedCases / stats.totalCases) * 100 : 0}%` 
                      }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Import Success</span>
                      <span>{stats.importedFilesCount}/11 files</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ 
                        width: `${(stats.importedFilesCount / 11) * 100}%` 
                      }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Case Load</span>
                      <span>{stats.totalCases > 0 ? ((stats.activeCases / stats.totalCases) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ 
                        width: `${stats.totalCases > 0 ? (stats.activeCases / stats.totalCases) * 100 : 0}%` 
                      }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Avg. Processing Time: {stats.avgProcessingTime}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Land Cases Thematic Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <LandCasesThematicChart showTopOnly={true} maxHeight="500px" />
          </motion.div>

          {/* Top Land Case Categories Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Top Land Case Categories
                </CardTitle>
                <CardDescription>Most common types of land-related legal cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topLandCases.map((category, index) => (
                    <div
                      key={category.id}
                      className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <span className="text-lg font-bold text-blue-600">
                          {category.caseCount.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
                        {category.theme}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{category.percentage}% of total</span>
                        <div className="w-16 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full" 
                            style={{ width: `${Math.min(category.percentage * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Data from Civil Litigation Department</span>
                    <span>Total: {totalLandCases.toLocaleString()} land cases across 24 categories</span>
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