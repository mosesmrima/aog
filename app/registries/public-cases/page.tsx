'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Scale, 
  Search, 
  ArrowLeft,
  Calendar,
  User,
  Building,
  FileText,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchPublicCases, mockPublicCases, type PublicCase } from '@/lib/mock-registries';

export default function PublicCasesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicCase[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Show trending cases by default
  const trendingCases = mockPublicCases.slice(0, 3);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = searchPublicCases(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'concluded':
        return <Badge className="bg-green-100 text-green-800">Concluded</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'dismissed':
        return <Badge className="bg-red-100 text-red-800">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const CaseCard = ({ case: caseItem, showFullDetails = false }: { case: PublicCase; showFullDetails?: boolean }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{caseItem.caseNumber}</h3>
            <p className="text-sm text-gray-600">{caseItem.court}</p>
          </div>
          {getStatusBadge(caseItem.status)}
        </div>

        <h4 className="font-medium text-gray-900 mb-3 leading-relaxed">
          {caseItem.title}
        </h4>

        {showFullDetails && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {caseItem.summary}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Petitioner:</span>
            <span className="text-gray-600">{caseItem.petitioner}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Building className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Respondent:</span>
            <span className="text-gray-600">{caseItem.respondent}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="font-medium">Filed:</span>
            <span className="text-gray-600">{formatDate(caseItem.dateRegistered)}</span>
          </div>

          {caseItem.judge && (
            <div className="flex items-center space-x-2 text-sm">
              <Scale className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Judge:</span>
              <span className="text-gray-600">{caseItem.judge}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="outline">{caseItem.category}</Badge>
          
          <div className="flex space-x-2">
            {caseItem.publicDocuments.length > 0 && (
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Documents ({caseItem.publicDocuments.length})
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
          </div>
        </div>

        {caseItem.outcome && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm font-medium text-green-800 mb-1">Case Outcome</div>
            <div className="text-sm text-green-700">{caseItem.outcome}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registries
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Public Cases Against Government</h1>
                <p className="text-blue-100">Court cases and legal proceedings involving government entities</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1,243</div>
                <div className="text-blue-200 text-sm">Total Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">67%</div>
                <div className="text-blue-200 text-sm">Concluded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">23%</div>
                <div className="text-blue-200 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10%</div>
                <div className="text-blue-200 text-sm">Pending</div>
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
                <Search className="w-5 h-5 text-blue-600" />
                Search Public Cases
              </CardTitle>
              <CardDescription>
                Search by case number, title, petitioner, respondent, or category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter case number, keywords, or party names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                <strong>Examples:</strong> Constitutional Law, Ministry of Education, CONST/2024/001, Healthcare
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
                  ({searchResults.length} case{searchResults.length !== 1 ? 's' : ''} found)
                </span>
              )}
            </h2>

            {searchResults.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cases Found</h3>
                  <p className="text-gray-600">
                    No cases matching "{searchQuery}" were found. Try different keywords or check the spelling.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {searchResults.map((caseItem) => (
                  <CaseCard key={caseItem.id} case={caseItem} showFullDetails={true} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Trending Cases */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-orange-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Recent & Notable Cases</h2>
            </div>

            <div className="space-y-6">
              {trendingCases.map((caseItem) => (
                <CaseCard key={caseItem.id} case={caseItem} showFullDetails={true} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchResults(mockPublicCases);
                  setHasSearched(true);
                }}
              >
                View All Cases
              </Button>
            </div>
          </motion.div>
        )}

        {/* Information Section */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>About Public Case Records</CardTitle>
                <CardDescription>Understanding public access to government legal proceedings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">What's Available</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Case numbers and titles</li>
                      <li>• Party names (petitioners and respondents)</li>
                      <li>• Case status and proceedings</li>
                      <li>• Court assignments and judges</li>
                      <li>• Public documents and filings</li>
                      <li>• Final judgments and outcomes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Case Categories</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Constitutional Law</li>
                      <li>• Public Procurement</li>
                      <li>• Employment Law</li>
                      <li>• Environmental Law</li>
                      <li>• Administrative Law</li>
                      <li>• Human Rights</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}