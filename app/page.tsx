'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
  TrendingUp,
  Heart,
  Scale,
  BookOpen,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();


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
                <div className="flex items-center justify-center">
                  <Image
                    src="/oag-logo.png"
                    alt="Office of the Attorney General and Department of Justice"
                    width={240}
                    height={60}
                    className="h-10 sm:h-12 w-auto"
                    priority
                  />
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
                  Public Records & Government Services
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Access public registries to search and verify official records, or manage internal departmental operations. 
                Serving both public information needs and government administrative functions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/registries')}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg font-semibold"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Public Records
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => router.push('/auth')}
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 px-6 py-4 rounded-xl transition-all duration-200 text-base"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Staff Portal
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
                    <h3 className="text-lg font-semibold text-gray-900">Public Records Portal</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">34,000+</div>
                      <div className="text-sm text-green-600">Public Records</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">5</div>
                      <div className="text-sm text-blue-600">Registries</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Marriage certificate verification</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Court cases & legal records</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">24/7 public access</span>
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
              Public Access & Government Services
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Providing transparent public access to government records while empowering OAG departments with secure, 
              efficient data management tools for internal operations and cross-departmental collaboration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Marriage Records Verification',
                description: 'Instantly verify marriage certificates and check validity of registered marriages. Public access to certificate verification with privacy protection.',
                color: 'pink',
              },
              {
                icon: Scale,
                title: 'Court Cases & Legal Records',
                description: 'Search public court cases and legal proceedings involving government entities. Access case details, documents, and status tracking.',
                color: 'blue',
              },
              {
                icon: Building2,
                title: 'Societies & Organizations',
                description: 'Find registered societies, organizations, and community groups. Check registration status, contact information, and compliance records.',
                color: 'green',
              },
              {
                icon: Users,
                title: 'Public Trustees Registry',
                description: 'Search deceased estates and public trustee records by limited criteria. Access PT cause numbers, folio numbers, and deceased information.',
                color: 'purple',
              },
              {
                icon: Lock,
                title: 'Staff Data Management',
                description: 'Secure internal portal for OAG staff to manage departmental data, collaborate across units, and maintain comprehensive audit trails.',
                color: 'red',
              },
              {
                icon: Shield,
                title: 'Privacy & Security',
                description: 'All public searches comply with data protection regulations. Internal operations feature role-based access and complete audit logging.',
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
              Serving the Public & Government
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Providing transparent public access to government records while supporting efficient internal operations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: '34,000+', label: 'Public Records', icon: Database },
              { number: '5', label: 'Active Registries', icon: Building2 },
              { number: '99.9%', label: 'System Uptime', icon: TrendingUp },
              { number: '24/7', label: 'Public Access', icon: Globe },
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

      {/* Public Registries Section */}
      <div className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Public Registries
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Access public records and registries managed by the Office of the Attorney General. 
              Search and view publicly available information across various departments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Marriage Registry',
                description: 'Search and view public marriage records, certificates, and registration information.',
                color: 'pink',
                href: '/registries/marriages'
              },
              {
                icon: Users,
                title: 'Societies Registry',
                description: 'Browse registered societies, organizations, and their compliance status.',
                color: 'green',
                href: '/registries/societies'
              },
              {
                icon: Scale,
                title: 'Legal Affairs Registry',
                description: 'Access public legal documents, case information, and court records.',
                color: 'blue',
                href: '/registries/legal-affairs'
              },
              {
                icon: MapPin,
                title: 'Land Cases Analysis',
                description: 'Comprehensive thematic analysis of land-related litigation and case trends.',
                color: 'amber',
                href: '/registries/land-cases'
              },
              {
                icon: BookOpen,
                title: 'Public Documents',
                description: 'View official publications, legal notices, and regulatory documents.',
                color: 'purple',
                href: '/registries/documents'
              },
              {
                icon: Building2,
                title: 'Corporate Registry',
                description: 'Search corporate entities, business registrations, and compliance records.',
                color: 'orange',
                href: '/registries/corporations'
              },
              {
                icon: FileSearch,
                title: 'Search All Records',
                description: 'Comprehensive search across all public registries and databases.',
                color: 'indigo',
                href: '/registries/search'
              },
            ].map((registry, index) => (
              <motion.div
                key={registry.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="group relative bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(registry.href)}
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-${registry.color}-500 to-${registry.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <registry.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  {registry.title}
                  <ExternalLink className="w-4 h-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {registry.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-12"
          >
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help with Public Records?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Our public registry system is designed to provide easy access to government records. 
                Contact us if you need assistance with your search or have questions about available records.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push('/registries/')}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Start Searching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Staff Portal Section */}
      <div className="py-20 bg-gradient-to-br from-gray-900 to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-blue-400 mr-3" />
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                OAG Staff Portal
              </h2>
            </div>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Secure internal portal for Office of the Attorney General staff. Access departmental data management, 
              cross-departmental collaboration tools, and comprehensive audit systems.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Data Management</h3>
                <p className="text-gray-400 text-sm">Secure access to departmental records and administrative functions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Collaboration</h3>
                <p className="text-gray-400 text-sm">Cross-departmental workflows and team coordination tools</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Security & Audit</h3>
                <p className="text-gray-400 text-sm">Complete audit trails and role-based access controls</p>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/auth')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg transition-all duration-200 text-lg"
            >
              <Lock className="mr-2 h-5 w-5" />
              Staff Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="mt-6 text-sm text-gray-500">
              Restricted Access • Role-Based Security • Audit Logged • Admin Approval Required
            </div>
          </motion.div>
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
              Access Public Records or Staff Portal
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Search and verify public records 24/7, or access the secure staff portal for internal 
              departmental operations and data management across the Attorney General's office.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/registries')}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg font-semibold"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Public Records
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push('/auth')}
                variant="outline"
                size="lg"
                className="border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-6 py-4 rounded-xl transition-all duration-200"
              >
                <Lock className="mr-2 h-4 w-4" />
                Staff Portal
              </Button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              Public Access • Privacy Protected • Government-Grade Security • 24/7 Available
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}