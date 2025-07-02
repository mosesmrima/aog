'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';

interface ChartData {
  month: string;
  marriages: number;
}

export function MarriagesChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Get marriages from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: marriages, error } = await supabase
          .from('marriages')
          .select('marriage_date')
          .gte('marriage_date', sixMonthsAgo.toISOString().split('T')[0])
          .order('marriage_date', { ascending: true });

        if (error) throw error;

        // Group by month
        const monthlyData: { [key: string]: number } = {};
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          monthlyData[monthKey] = 0;
        }

        // Count marriages by month (using actual marriage date)
        marriages?.forEach((marriage) => {
          const date = new Date(marriage.marriage_date);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
          }
        });

        const chartData = Object.entries(monthlyData).map(([month, marriages]) => ({
          month,
          marriages,
        }));

        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Marriage Registrations</CardTitle>
          <CardDescription>
            Monthly trends over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Bar 
                  dataKey="marriages" 
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}