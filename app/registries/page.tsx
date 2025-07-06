'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Scale, 
  Building2, 
  Users,
  ArrowRight,
  Search,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RegistryInfo {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  icon: React.ElementType;
  route: string;
  accessLevel: 'verification' | 'full' | 'limited';
  color: string;
  features: string[];
}

const registries: RegistryInfo[] = [
  {
    id: 'marriages',
    name: 'Marriage Records',
    description: 'Verify marriage certificates and check validity of registered marriages',
    recordCount: 3356,
    icon: Heart,
    route: '/registries/marriages',
    accessLevel: 'verification',
    color: 'from-pink-500 to-rose-600',
    features: ['Certificate Verification', 'Validity Check', 'Official Requests']
  },
  {
    id: 'public-cases',
    name: 'Public Cases Against Government',
    description: 'Search public court cases and legal proceedings involving government entities',
    recordCount: 1243,
    icon: Scale,
    route: '/registries/public-cases',
    accessLevel: 'full',
    color: 'from-blue-500 to-indigo-600',
    features: ['Full Case Details', 'Legal Documents', 'Case Status Tracking']
  },
  {
    id: 'societies',
    name: 'Societies Registry',
    description: 'Find registered societies, organizations and community groups',
    recordCount: 892,
    icon: Building2,
    route: '/registries/societies',
    accessLevel: 'full',
    color: 'from-green-500 to-emerald-600',
    features: ['Registration Details', 'Organization Status', 'Contact Information']
  },
  {
    id: 'adoptions',
    name: 'Adoptions Registry',
    description: 'Limited public information about adoption processes and statistics',
    recordCount: 156,
    icon: Users,
    route: '/registries/adoptions',
    accessLevel: 'limited',
    color: 'from-purple-500 to-violet-600',
    features: ['Statistical Information', 'Process Guidelines', 'Privacy Protected']
  }
];

const getAccessBadge = (accessLevel: string) => {
  switch (accessLevel) {
    case 'verification':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Verification Only</Badge>;
    case 'full':
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Full Access</Badge>;
    case 'limited':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Limited Access</Badge>;
    default:
      return null;
  }
};

export default function RegistriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Public Registries Portal
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Access and verify records from the Office of the Attorney General's official registries. 
              Search marriages, court cases, societies, and more with appropriate privacy protections.
            </p>
            
            <div className="flex items-center justify-center mt-8 space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {registries.reduce((sum, reg) => sum + reg.recordCount, 0).toLocaleString()}
                </div>
                <div className="text-blue-200 text-sm">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{registries.length}</div>
                <div className="text-blue-200 text-sm">Active Registries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm">Public Access</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Registries Grid */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Registries</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select a registry to search and verify records. Each registry has different access levels 
            based on privacy requirements and data protection regulations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {registries.map((registry, index) => {
            const Icon = registry.icon;
            return (
              <motion.div
                key={registry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${registry.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      {getAccessBadge(registry.accessLevel)}
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {registry.name}
                    </CardTitle>
                    
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {registry.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Total Records</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {registry.recordCount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Available Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {registry.features.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Link href={registry.route} className="block">
                        <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white group-hover:scale-105 transition-all duration-200">
                          <Search className="w-4 h-4 mr-2" />
                          Search {registry.name}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16"
        >
          <Card className="max-w-4xl mx-auto border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Privacy Protected</h3>
                  <p className="text-sm text-gray-600">
                    All searches comply with data protection regulations and privacy laws.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Verification</h3>
                  <p className="text-sm text-gray-600">
                    Real-time search results with immediate verification status.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Official Records</h3>
                  <p className="text-sm text-gray-600">
                    Authoritative data directly from government registries.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}