'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Table, Download, Info, TrendingUp, Scale } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  landCasesThematicData, 
  getTopLandCaseCategories, 
  calculateLandCaseStats,
  totalLandCases,
  type LandCaseTheme 
} from '@/lib/land-cases-data';

interface LandCasesThematicChartProps {
  showTopOnly?: boolean;
  maxHeight?: string;
}

export function LandCasesThematicChart({ showTopOnly = false, maxHeight = 'auto' }: LandCasesThematicChartProps) {
  const [selectedView, setSelectedView] = useState<'chart' | 'table'>('chart');
  const [selectedCategory, setSelectedCategory] = useState<LandCaseTheme | null>(null);

  const stats = calculateLandCaseStats();
  const displayData = showTopOnly ? getTopLandCaseCategories(10) : landCasesThematicData;
  const maxValue = Math.max(...displayData.map(item => item.caseCount));

  const getBarColor = (percentage: number) => {
    if (percentage > 30) return 'bg-red-500';
    if (percentage > 15) return 'bg-orange-500';
    if (percentage > 5) return 'bg-yellow-500';
    if (percentage > 2) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Nature of Claim', 'Number of Cases', 'Percentage', 'Description'];
    const csvContent = [
      headers.join(','),
      ...displayData
        .sort((a, b) => b.caseCount - a.caseCount)
        .map((item, index) => [
          index + 1,
          `"${item.theme}"`,
          item.caseCount,
          `${item.percentage}%`,
          `"${item.description || ''}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `land-cases-thematic-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Land Cases by Thematic Area</CardTitle>
              <CardDescription>
                Civil Litigation Department - {totalLandCases.toLocaleString()} total cases across {stats.totalCategories} categories
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.totalCategories}</div>
            <div className="text-xs text-blue-600">Categories</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.averagePerCategory}</div>
            <div className="text-xs text-green-600">Avg/Category</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{stats.topCategory.caseCount}</div>
            <div className="text-xs text-orange-600">Highest Count</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{stats.highVolumeCategories}</div>
            <div className="text-xs text-purple-600">High Volume</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'chart' | 'table')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Chart View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center">
              <Table className="w-4 h-4 mr-2" />
              Table View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-6">
            <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
              {displayData
                .sort((a, b) => b.caseCount - a.caseCount)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <div 
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCategory(selectedCategory?.id === item.id ? null : item)}
                    >
                      <div className="flex-shrink-0 w-8 text-sm font-medium text-gray-500">
                        #{index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.theme}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.percentage}%
                            </Badge>
                            <span className="text-sm font-semibold text-gray-700">
                              {item.caseCount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.caseCount / maxValue) * 100}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`h-2 rounded-full ${getBarColor(item.percentage)}`}
                          />
                        </div>
                      </div>
                    </div>

                    {selectedCategory?.id === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-12 mt-2 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                      >
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{item.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>Cases: {item.caseCount.toLocaleString()}</span>
                              <span>Percentage: {item.percentage}%</span>
                              <span>Rank: #{index + 1}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <div className="overflow-x-auto" style={{ maxHeight, overflowY: 'auto' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Rank</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Nature of Claim</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Cases</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Percentage</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData
                    .sort((a, b) => b.caseCount - a.caseCount)
                    .map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 text-sm text-gray-600">#{index + 1}</td>
                        <td className="p-3 text-sm font-medium text-gray-900">{item.theme}</td>
                        <td className="p-3 text-sm text-right font-semibold text-gray-700">
                          {item.caseCount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600 max-w-xs">
                          {item.description}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>Top category: {stats.topCategory.theme}</span>
            </div>
            <div className="text-gray-500">
              Data from Office of the Attorney General - Civil Litigation Department
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}