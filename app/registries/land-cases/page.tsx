'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin,
  BarChart3,
  Download,
  TrendingUp,
  Scale,
  FileText,
  Building,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandCasesThematicChart } from '@/components/legal-affairs/land-cases-thematic-chart';
import { 
  landCasesThematicData, 
  getTopLandCaseCategories, 
  calculateLandCaseStats,
  totalLandCases 
} from '@/lib/land-cases-data';

export default function LandCasesAnalyticsPage() {
  const stats = calculateLandCaseStats();
  const topCategories = getTopLandCaseCategories(3);
  const bottomCategories = landCasesThematicData
    .sort((a, b) => a.caseCount - b.caseCount)
    .slice(0, 3);

  const exportFullReport = () => {
    const headers = [
      'Rank', 'Nature of Claim', 'Number of Cases', 'Percentage of Total', 
      'Cases Above Average', 'Description'
    ];
    
    const csvContent = [
      'Land Cases Thematic Analysis Report',
      `Generated on: ${new Date().toISOString().split('T')[0]}`,
      `Total Cases: ${totalLandCases.toLocaleString()}`,
      `Total Categories: ${stats.totalCategories}`,
      `Average per Category: ${stats.averagePerCategory}`,
      '',
      headers.join(','),
      ...landCasesThematicData
        .sort((a, b) => b.caseCount - a.caseCount)
        .map((item, index) => [
          index + 1,
          `"${item.theme}"`,
          item.caseCount,
          `${item.percentage}%`,
          item.caseCount > stats.averagePerCategory ? 'Yes' : 'No',
          `"${item.description || ''}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oag-land-cases-full-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-orange-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registries
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Land Cases Thematic Analysis</h1>
                <p className="text-orange-100">Comprehensive breakdown of land-related litigation by case type</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{totalLandCases.toLocaleString()}</div>
                <div className="text-orange-200 text-sm">Total Land Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalCategories}</div>
                <div className="text-orange-200 text-sm">Case Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.averagePerCategory}</div>
                <div className="text-orange-200 text-sm">Avg per Category</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.highVolumeCategories}</div>
                <div className="text-orange-200 text-sm">High Volume Types</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
                Highest Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCategories.map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {category.theme.length > 30 ? `${category.theme.substring(0, 30)}...` : category.theme}
                      </div>
                      <div className="text-xs text-gray-500">#{index + 1} most common</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{category.caseCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="font-medium">Office of the Attorney General</div>
                    <div className="text-sm text-gray-600">Civil Litigation Department</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Comprehensive analysis of land cases by thematic area, providing insights into litigation patterns and government land management challenges.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Lowest Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bottomCategories.map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {category.theme.length > 30 ? `${category.theme.substring(0, 30)}...` : category.theme}
                      </div>
                      <div className="text-xs text-gray-500">#{landCasesThematicData.length - index} least common</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{category.caseCount}</div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <LandCasesThematicChart showTopOnly={false} />
        </motion.div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Case Distribution Analysis */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Distribution Analysis
              </CardTitle>
              <CardDescription>Statistical breakdown of land case categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">High Volume Categories</span>
                    <Badge variant="destructive">{stats.highVolumeCategories} categories</Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    Categories with more than {stats.averagePerCategory} cases (above average)
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Most Common Issue</span>
                    <Badge variant="secondary">{stats.topCategory.percentage}%</Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {stats.topCategory.theme} ({stats.topCategory.caseCount.toLocaleString()} cases)
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Average Cases per Category</span>
                    <Badge variant="outline">{stats.averagePerCategory}</Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    Mean distribution across all {stats.totalCategories} thematic areas
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    This analysis helps identify the most pressing land-related legal issues facing the government and can inform policy decisions and resource allocation.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export and Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Reports & Export
              </CardTitle>
              <CardDescription>Download comprehensive analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={exportFullReport}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Full Analysis Report
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/registries/public-cases">
                    <Button variant="outline" className="w-full">
                      <Scale className="w-4 h-4 mr-2" />
                      View Cases
                    </Button>
                  </Link>
                  <Link href="/departments/legal-affairs/dashboard">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Report Includes:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Complete ranking of all 24 thematic categories</li>
                    <li>• Case counts and percentage breakdowns</li>
                    <li>• Statistical analysis and insights</li>
                    <li>• Category descriptions and context</li>
                    <li>• Above/below average indicators</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Data Source:</strong> Office of the Attorney General, Civil Litigation Department
                </p>
                <p>
                  This thematic analysis provides insights into land-related litigation patterns to support evidence-based policy making and legal strategy development.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}