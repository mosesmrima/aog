'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowRight, 
  Users, 
  Database, 
  FileSearch, 
  BarChart3, 
  Lock, 
  Clock, 
  CheckCircle,
  Building2,
  Globe,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.is_approved) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
                  Government of Kenya
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Office of the{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Attorney General
                  </span>
                </h1>
                <h2 className="text-xl lg:text-2xl text-gray-700 font-medium">
                  Digital Records Management System
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Streamline operations across Office of the Attorney General departments with secure, centralized data management. 
                Built for OAG cross-departmental collaboration, comprehensive audit trails, and regulatory compliance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/auth')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg"
                >
                  Access System
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Government Data Portal</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">Multi-Dept</div>
                      <div className="text-sm text-blue-600">Data Access</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">Secure</div>
                      <div className="text-sm text-green-600">Audit Trails</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Cross-departmental collaboration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Who changed what tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Advanced search & filters</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Empowering OAG Departments
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Transform how Office of the Attorney General departments manage, access, and collaborate on critical data across the organization, 
              ensuring efficiency, transparency, and compliance with legal and regulatory standards.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'OAG Cross-Department Collaboration',
                description: 'Enable seamless collaboration between Attorney General departments while maintaining secure access controls and data boundaries for each unit.',
                color: 'blue',
              },
              {
                icon: Database,
                title: 'Unified Data Management',
                description: 'Centralize all OAG departmental data in one secure platform, eliminating information silos and ensuring consistency across the Attorney General office.',
                color: 'purple',
              },
              {
                icon: FileSearch,
                title: 'Intelligent Search Engine',
                description: 'Find any record instantly with progressive search across all data fields, with department-specific filtering and advanced query capabilities.',
                color: 'green',
              },
              {
                icon: BarChart3,
                title: 'Comprehensive Analytics',
                description: 'Generate insights with real-time analytics on OAG departmental performance, data quality metrics, and operational efficiency across all Attorney General units.',
                color: 'orange',
              },
              {
                icon: Lock,
                title: 'Complete Audit Trail',
                description: 'Track who changed what, when, and why with detailed audit logs. Every action is recorded for legal compliance, accountability, and security within the OAG.',
                color: 'red',
              },
              {
                icon: Clock,
                title: 'Real-Time Operations',
                description: 'Enable OAG departments to work in real-time with instant updates, notifications, and synchronization across all connected systems.',
                color: 'indigo',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="group relative bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Trusted by OAG Departments
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Supporting efficient Attorney General operations through secure, scalable data management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: 'Multi-Dept', label: 'Data Integration', icon: Database },
              { number: 'OAG Depts', label: 'Collaboration', icon: Building2 },
              { number: '99.9%', label: 'System Uptime', icon: TrendingUp },
              { number: '24/7', label: 'Secure Access', icon: Globe },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-blue-200" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-200 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Department's Operations?
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Join the digital transformation of Attorney General services. Access secure, efficient, 
              and compliant data management designed for modern OAG inter-departmental operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/auth')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg"
              >
                Access Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              Secure • Compliant • Government-Grade • 24/7 Support
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}