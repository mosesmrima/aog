'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  TrendingUp,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchSocieties, mockSocieties, type Society } from '@/lib/mock-registries';

export default function SocietiesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Society[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Show recent societies by default
  const recentSocieties = mockSocieties.slice(0, 3);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = searchSocieties(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case 'dissolved':
        return <Badge className="bg-red-100 text-red-800">Dissolved</Badge>;
      case 'under-review':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Youth Development': 'bg-blue-100 text-blue-800',
      'Environmental Conservation': 'bg-green-100 text-green-800',
      'Technology & Innovation': 'bg-purple-100 text-purple-800',
      'Agricultural Development': 'bg-orange-100 text-orange-800',
      'Education & Training': 'bg-indigo-100 text-indigo-800',
      'Healthcare': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const SocietyCard = ({ society }: { society: Society }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{society.name}</h3>
            <p className="text-sm text-gray-600">Reg No: {society.registrationNumber}</p>
          </div>
          {getStatusBadge(society.status)}
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {society.objectives}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Registered:</span>
            <span className="text-gray-600">{formatDate(society.dateRegistered)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="font-medium">Location:</span>
            <span className="text-gray-600">{society.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Address:</span>
            <span className="text-gray-600">{society.registeredAddress}</span>
          </div>

          {society.contactPerson && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Contact Person:</span>
              <span className="text-gray-600">{society.contactPerson}</span>
            </div>
          )}

          {society.phoneNumber && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Phone:</span>
              <span className="text-gray-600">{society.phoneNumber}</span>
            </div>
          )}

          {society.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Email:</span>
              <span className="text-gray-600">{society.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="outline" className={getCategoryColor(society.category)}>
            {society.category}
          </Badge>
          
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-green-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registries
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Societies Registry</h1>
                <p className="text-green-100">Registered societies, organizations and community groups</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">892</div>
                <div className="text-green-200 text-sm">Total Societies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">87%</div>
                <div className="text-green-200 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">156</div>
                <div className="text-green-200 text-sm">New This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24</div>
                <div className="text-green-200 text-sm">Categories</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-green-600" />
                Search Societies
              </CardTitle>
              <CardDescription>
                Search by society name, registration number, category, or location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter society name, registration number, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <strong>Examples:</strong> Youth Foundation, Environmental, SOC/2024/0156, Nairobi
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Results */}
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({searchResults.length} societ{searchResults.length !== 1 ? 'ies' : 'y'} found)
                </span>
              )}
            </h2>

            {searchResults.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Societies Found</h3>
                  <p className="text-gray-600">
                    No societies matching "{searchQuery}" were found. Try different keywords or check the spelling.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {searchResults.map((society) => (
                  <SocietyCard key={society.id} society={society} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Societies */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-orange-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Recently Registered Societies</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {recentSocieties.map((society) => (
                <SocietyCard key={society.id} society={society} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchResults(mockSocieties);
                  setHasSearched(true);
                }}
              >
                View All Societies
              </Button>
            </div>
          </motion.div>
        )}

        {/* Categories Overview */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Society Categories</CardTitle>
                <CardDescription>Browse societies by their primary focus areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    'Youth Development',
                    'Environmental Conservation',
                    'Technology & Innovation',
                    'Agricultural Development',
                    'Education & Training',
                    'Healthcare'
                  ].map((category) => (
                    <div 
                      key={category}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchQuery(category);
                        handleSearch();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{category}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {mockSocieties.filter(s => s.category === category).length} societies
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}