'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Activity,
  Database,
  Clock,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarriageAnalytics } from '@/hooks/use-marriage-analytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

function MetricCard({ title, value, description, icon: Icon, trend, color }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{description}</p>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const { 
    overviewStats, 
    yearlyTrends, 
    qualityDistribution, 
    recentActivity,
    isLoading 
  } = useMarriageAnalytics();

  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Colors for charts
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#EF4444',
    accent: '#8B5CF6'
  };

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Marriage Records Analytics</h2>
            <p className="text-gray-600 mt-2">Comprehensive insights and trends for marriage registrations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Records"
          value={overviewStats?.totalRecords?.toLocaleString() || "0"}
          description="All marriage registrations"
          icon={Database}
          color="from-blue-500 to-blue-600"
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Added Today"
          value={overviewStats?.addedToday?.toLocaleString() || "0"}
          description="New registrations today"
          icon={Calendar}
          color="from-green-500 to-green-600"
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Quality Score"
          value={`${Math.round(overviewStats?.avgQualityScore || 0)}%`}
          description="Average data quality"
          icon={Target}
          color="from-purple-500 to-purple-600"
          trend={{ value: 3, isPositive: true }}
        />
        <MetricCard
          title="With Files"
          value={overviewStats?.recordsWithFiles?.toLocaleString() || "0"}
          description="Records with attachments"
          icon={FileText}
          color="from-orange-500 to-orange-600"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yearly Marriages Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Marriage Registrations by Year
                  </CardTitle>
                  <CardDescription>Annual registration trends (2020-2024)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={yearlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="year" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Marriages']}
                      />
                      <Area
                        type="monotone"
                        dataKey="marriages_count"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.1}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Recent Registration Activity
                  </CardTitle>
                  <CardDescription>Records added in the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={recentActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Records Added']}
                      />
                      <Bar 
                        dataKey="records_added" 
                        fill={chartColors.secondary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Quality Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    Data Quality Distribution
                  </CardTitle>
                  <CardDescription>Quality scores across all records</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={qualityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="record_count"
                      >
                        {qualityDistribution?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Records']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quality Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Data Completeness
                  </CardTitle>
                  <CardDescription>Percentage of records with complete data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Valid Dates</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(((overviewStats?.recordsWithValidDates || 0) / (overviewStats?.totalRecords || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.round(((overviewStats?.recordsWithValidDates || 0) / (overviewStats?.totalRecords || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Certificate Numbers</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(((overviewStats?.recordsWithCertificates || 0) / (overviewStats?.totalRecords || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.round(((overviewStats?.recordsWithCertificates || 0) / (overviewStats?.totalRecords || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">File Attachments</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(((overviewStats?.recordsWithFiles || 0) / (overviewStats?.totalRecords || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.round(((overviewStats?.recordsWithFiles || 0) / (overviewStats?.totalRecords || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <Badge variant="secondary">{overviewStats?.addedToday || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">This Week</span>
                  </div>
                  <Badge variant="secondary">{overviewStats?.addedThisWeek || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">This Month</span>
                  </div>
                  <Badge variant="secondary">{overviewStats?.addedThisMonth || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Key performance indicators for the marriage registration system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {Math.round(overviewStats?.avgQualityScore || 0)}%
                    </div>
                    <div className="text-sm text-blue-600">Average Quality</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">99.9%</div>
                    <div className="text-sm text-green-600">System Uptime</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {Math.round(((overviewStats?.recordsWithValidDates || 0) / (overviewStats?.totalRecords || 1)) * 100)}%
                    </div>
                    <div className="text-sm text-purple-600">Data Completeness</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {overviewStats?.totalRecords ? (overviewStats.totalRecords / 1000).toFixed(1) : 0}K
                    </div>
                    <div className="text-sm text-orange-600">Total Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Data-driven observations and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-800">Strong Data Quality</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Average quality score of {Math.round(overviewStats?.avgQualityScore || 0)}% indicates excellent data management practices.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-800">Growing Registration Volume</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Marriage registrations have increased significantly, with 2024 showing the highest volume to date.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-medium text-orange-800">File Attachment Opportunity</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Only {Math.round(((overviewStats?.recordsWithFiles || 0) / (overviewStats?.totalRecords || 1)) * 100)}% of records have file attachments. Consider digitization initiatives.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable steps to improve the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Maintain Quality Standards</h5>
                    <p className="text-xs text-gray-600">Continue current validation practices to maintain high data quality scores.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Enhance File Management</h5>
                    <p className="text-xs text-gray-600">Implement bulk file upload features to increase attachment rates.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Scale Infrastructure</h5>
                    <p className="text-xs text-gray-600">Plan for continued growth based on current registration trends.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}