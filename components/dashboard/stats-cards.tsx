'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface StatsData {
  totalMarriages: number;
  thisMonthMarriages: number;
  totalUsers: number;
  recentAudits: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalMarriages: 0,
    thisMonthMarriages: 0,
    totalUsers: 0,
    recentAudits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total marriages
        const { count: totalMarriages } = await supabase
          .from('marriages')
          .select('*', { count: 'exact', head: true });

        // Get this month's marriages
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: thisMonthMarriages } = await supabase
          .from('marriages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString());

        // Get total users
        const { count: totalUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Get recent audits (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentAudits } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        setStats({
          totalMarriages: totalMarriages || 0,
          thisMonthMarriages: thisMonthMarriages || 0,
          totalUsers: totalUsers || 0,
          recentAudits: recentAudits || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Marriages',
      value: stats.totalMarriages,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'This Month',
      value: stats.thisMonthMarriages,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Recent Activity',
      value: stats.recentAudits,
      icon: FileText,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden backdrop-blur-lg bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                ) : (
                  card.value.toLocaleString()
                )}
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}