'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft,
  Shield,
  Clock,
  BarChart3,
  MapPin,
  TrendingUp,
  Info,
  Baby
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAdoptionStats } from '@/lib/mock-registries';

export default function AdoptionsRegistryPage() {
  const stats = mockAdoptionStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-violet-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-purple-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registries
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Adoptions Registry</h1>
                <p className="text-purple-100">Statistical information and process guidelines (Privacy Protected)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalAdoptions}</div>
                <div className="text-purple-200 text-sm">Total Adoptions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.thisYear}</div>
                <div className="text-purple-200 text-sm">This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.averageProcessingTime}</div>
                <div className="text-purple-200 text-sm">Avg Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.completionRate}%</div>
                <div className="text-purple-200 text-sm">Success Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Shield className="w-6 h-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Confidential Registry - Privacy Protected</h3>
                  <p className="text-red-800 text-sm leading-relaxed">
                    Adoption records contain highly sensitive information about children and families. 
                    This registry provides only statistical information and general process guidelines. 
                    Individual adoption records are strictly confidential and not accessible through 
                    public search. All adoption-related inquiries must be directed through official 
                    legal channels with proper authorization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Age Group Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-purple-600" />
                Adoptions by Age Group
              </CardTitle>
              <CardDescription>Distribution of completed adoptions by child age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.byAgeGroup.map((group, index) => {
                  const percentage = Math.round((group.count / stats.totalAdoptions) * 100);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{group.ageRange}</span>
                        <span className="text-gray-600">{group.count} adoptions ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Regional Distribution
              </CardTitle>
              <CardDescription>Adoptions processed by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.byRegion.map((region, index) => {
                  const percentage = Math.round((region.count / stats.totalAdoptions) * 100);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{region.region}</span>
                        <span className="text-gray-600">{region.count} adoptions ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Process Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid lg:grid-cols-2 gap-8 mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Process Timeline
              </CardTitle>
              <CardDescription>Typical adoption process stages and duration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">Initial Application</div>
                    <div className="text-sm text-blue-700">Documentation and background checks</div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">1-2 months</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-medium text-purple-900">Home Study</div>
                    <div className="text-sm text-purple-700">Social worker assessment and visits</div>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">2-3 months</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">Matching Process</div>
                    <div className="text-sm text-green-700">Finding suitable child placement</div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">3-6 months</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium text-orange-900">Court Proceedings</div>
                    <div className="text-sm text-orange-700">Legal finalization process</div>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">2-3 months</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Success Metrics
              </CardTitle>
              <CardDescription>Adoption process effectiveness indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Process Completion Rate</span>
                    <span className="text-gray-600">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Percentage of applications that result in successful adoption
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Average Processing Time</span>
                    <span className="text-gray-600">{stats.averageProcessingTime}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Time from initial application to court finalization
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">New Applications This Year</span>
                    <span className="text-gray-600">{Math.round(stats.thisYear * 1.3)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Applications received in current year
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Important Information
              </CardTitle>
              <CardDescription>Key details about adoption processes and requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Eligibility Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Must be at least 25 years old</li>
                    <li>• At least 21 years older than the child</li>
                    <li>• Stable income and housing</li>
                    <li>• Clean criminal background check</li>
                    <li>• Completed home study assessment</li>
                    <li>• Character references required</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Required Documentation</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Birth certificate and ID documents</li>
                    <li>• Marriage certificate (if applicable)</li>
                    <li>• Medical and psychological reports</li>
                    <li>• Financial statements</li>
                    <li>• Employment verification</li>
                    <li>• References from community members</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">Contact Information</h4>
                <p className="text-sm text-indigo-800">
                  For adoption inquiries, applications, or legal assistance, contact the Department of Children's Services 
                  or consult with a qualified adoption attorney. All adoption records and proceedings are handled through 
                  official government channels with strict confidentiality protocols.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}