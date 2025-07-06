'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Clock, CheckCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ title, value, description, icon: Icon, color }: MetricCardProps) {
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
          <p className="text-xs text-gray-500">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AdministrationAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    systemUptime: '99.9%'
  });

  useEffect(() => {
    // Simulate analytics data - replace with real data fetching
    const loadStats = () => {
      setStats({
        totalUsers: 45,
        activeUsers: 32,
        pendingApprovals: 3,
        systemUptime: '99.9%'
      });
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered users"
          icon={Users}
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers}
          description="Active this month"
          icon={CheckCircle}
          color="from-green-500 to-green-600"
        />
        <MetricCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          description="Awaiting approval"
          icon={Clock}
          color="from-amber-500 to-amber-600"
        />
        <MetricCard
          title="System Uptime"
          value={stats.systemUptime}
          description="This month"
          icon={CheckCircle}
          color="from-purple-500 to-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity Overview</CardTitle>
          <CardDescription>
            System usage and user management statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>User analytics charts will be implemented here</p>
            <p className="text-sm">Connect to user activity logs for real-time data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}