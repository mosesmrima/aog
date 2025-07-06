'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Search, 
  Shield, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchMarriages, type MarriageVerification } from '@/lib/mock-registries';

export default function MarriagesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MarriageVerification[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = searchMarriages(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'revoked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 to-rose-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-pink-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registries
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Marriage Records</h1>
                <p className="text-pink-100">Certificate verification and validation service</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">3,356</div>
                <div className="text-pink-200 text-sm">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.2%</div>
                <div className="text-pink-200 text-sm">Valid Certificates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-pink-200 text-sm">Verification Service</div>
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Shield className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Privacy Protection Notice</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Marriage records contain sensitive personal information. This verification service only confirms 
                    the existence and validity of certificates without revealing personal details of the parties involved. 
                    For official certified copies or detailed information, please submit an official request through 
                    the appropriate channels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-pink-600" />
                Marriage Certificate Verification
              </CardTitle>
              <CardDescription>
                Enter a certificate number to verify its authenticity and validity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter certificate number (e.g., MC/2024/001234)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <strong>Examples:</strong> MC/2024/001234, MC/2023/005678, MC/2022/009876
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
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Results
              {searchResults.length > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found)
                </span>
              )}
            </h2>

            {searchResults.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-gray-600 mb-6">
                    The certificate number "{searchQuery}" was not found in our records. 
                    Please check the number and try again.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Ensure the certificate number is correctly formatted</li>
                      <li>• Check for any typing errors or missing characters</li>
                      <li>• Contact the issuing registrar office for assistance</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Certificate: {result.certificateNumber}
                            </h3>
                            <p className="text-sm text-gray-600">Marriage Record Verification</p>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm font-medium">Verification Status</div>
                            <div className="text-sm text-gray-600">Certificate Exists</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium">Registration Year</div>
                            <div className="text-sm text-gray-600">{result.yearRange}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <div>
                            <div className="text-sm font-medium">Issued By</div>
                            <div className="text-sm text-gray-600">{result.registrationLocation}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Certificate Verified</span>
                        </div>
                        <p className="text-sm text-green-700">
                          This certificate number is registered in our official records and is currently valid.
                        </p>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Request Official Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* How to Use */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>How to Use This Service</CardTitle>
                <CardDescription>Follow these steps to verify a marriage certificate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-pink-600" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Enter Certificate Number</h3>
                    <p className="text-sm text-gray-600">
                      Type the complete certificate number as it appears on the marriage certificate.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">2. Instant Verification</h3>
                    <p className="text-sm text-gray-600">
                      Our system will check the certificate against official records and show verification status.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Get Results</h3>
                    <p className="text-sm text-gray-600">
                      View verification results and request official copies if needed for legal purposes.
                    </p>
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