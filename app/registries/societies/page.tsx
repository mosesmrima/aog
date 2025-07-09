'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  Search, 
  ArrowLeft,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Society {
  id: string;
  registered_name: string | null;
  registration_date: string | null;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function SocietiesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [showSocietyDetails, setShowSocietyDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [yearRange, setYearRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
  // Statistics
  const [stats, setStats] = useState({
    totalSocieties: 0,
    thisYear: 0,
    lastYear: 0,
    recent: 0
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim()) {
        loadFilteredSocieties(query);
      } else {
        setFilteredSocieties(societies);
      }
    }, 300),
    [societies]
  );

  useEffect(() => {
    loadSocieties();
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (!searchQuery) {
      applyFilters();
    }
  }, [selectedYear, yearRange, societies]);

  const loadSocieties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('societies')
        .select(`
          id,
          registered_name,
          registration_date,
          registration_number,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw new Error(`Failed to load societies: ${error.message}`);
      }
      
      const societiesData = data || [];
      setSocieties(societiesData);
      setFilteredSocieties(societiesData);
      
      // Calculate statistics
      const totalSocieties = societiesData.length;
      const currentYear = new Date().getFullYear();
      const thisYear = societiesData.filter(s => 
        s.registration_date && 
        new Date(s.registration_date).getFullYear() === currentYear
      ).length;
      
      const lastYear = societiesData.filter(s => 
        s.registration_date && 
        new Date(s.registration_date).getFullYear() === currentYear - 1
      ).length;
      
      const recent = societiesData.filter(s => 
        s.created_at && 
        new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalSocieties,
        thisYear,
        lastYear,
        recent
      });
      
    } catch (error) {
      console.error('Error loading societies:', error);
      setError(error instanceof Error ? error.message : 'Failed to load societies data');
      setSocieties([]);
      setFilteredSocieties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilteredSocieties = async (query: string) => {
    try {
      let supabaseQuery = supabase
        .from('societies')
        .select(`
          id,
          registered_name,
          registration_date,
          registration_number,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Apply fuzzy search
      if (query.trim()) {
        const searchTerm = query.trim();
        supabaseQuery = supabaseQuery.or(`registered_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;
      
      let results = data || [];
      
      // Apply date filters
      if (selectedYear !== 'all') {
        results = results.filter(society => {
          if (!society.registration_date) return false;
          const year = new Date(society.registration_date).getFullYear();
          return year.toString() === selectedYear;
        });
      }
      
      if (yearRange.start || yearRange.end) {
        results = results.filter(society => {
          if (!society.registration_date) return false;
          const date = new Date(society.registration_date);
          const start = yearRange.start ? new Date(yearRange.start) : new Date('1900-01-01');
          const end = yearRange.end ? new Date(yearRange.end) : new Date();
          return date >= start && date <= end;
        });
      }
      
      setFilteredSocieties(results);
      
    } catch (error) {
      console.error('Error filtering societies:', error);
      applyFilters();
    }
  };

  const applyFilters = () => {
    let filtered = [...societies];
    
    // Apply year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(society => {
        if (!society.registration_date) return false;
        const year = new Date(society.registration_date).getFullYear();
        return year.toString() === selectedYear;
      });
    }
    
    // Apply date range filter
    if (yearRange.start || yearRange.end) {
      filtered = filtered.filter(society => {
        if (!society.registration_date) return false;
        const date = new Date(society.registration_date);
        const start = yearRange.start ? new Date(yearRange.start) : new Date('1900-01-01');
        const end = yearRange.end ? new Date(yearRange.end) : new Date();
        return date >= start && date <= end;
      });
    }
    
    setFilteredSocieties(filtered);
  };

  const getAvailableYears = () => {
    const years = new Set<number>();
    societies.forEach(society => {
      if (society.registration_date) {
        years.add(new Date(society.registration_date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Registered Name', 'Registration Date', 'Registration Number'];
    
    const csvContent = [
      headers.join(','),
      ...filteredSocieties.map(society => [
        society.registered_name || '',
        society.registration_date || '',
        society.registration_number || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `societies-registry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPaginatedSocieties = (): Society[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSocieties.slice(startIndex, endIndex);
  };

  const getTotalPages = (): number => {
    return Math.ceil(filteredSocieties.length / itemsPerPage);
  };

  const getRegistrationTrend = () => {
    const yearCounts = societies.reduce((acc, society) => {
      if (society.registration_date) {
        const year = new Date(society.registration_date).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    
    return years.map(year => ({
      year,
      count: yearCounts[year] || 0
    }));
  };

  const SocietyCard = ({ society }: { society: Society }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {society.registered_name || 'Unnamed Society'}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span className="font-medium">Registration No:</span>
                <span className="ml-1">{society.registration_number || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">Registered:</span>
                <span className="ml-1">{formatDate(society.registration_date)}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSociety(society);
              setShowSocietyDetails(true);
            }}
          >
            <Eye className="w-4 h-4" />
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
              <div className="flex items-center justify-center mr-4">
                <Image
                  src="/oag-logo.png"
                  alt="Office of the Attorney General and Department of Justice"
                  width={240}
                  height={60}
                  className="h-10 sm:h-12 w-auto filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Societies Registry</h1>
                <p className="text-green-100">Search registered societies and organizations</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalSocieties}</div>
                <div className="text-green-200 text-sm">Total Societies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.thisYear}</div>
                <div className="text-green-200 text-sm">This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.lastYear}</div>
                <div className="text-green-200 text-sm">Last Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.recent}</div>
                <div className="text-green-200 text-sm">Recent</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by society name or registration number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredSocieties.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {getAvailableYears().map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={yearRange.start}
                    onChange={(e) => setYearRange({ ...yearRange, start: e.target.value })}
                  />
                  
                  <Input
                    type="date"
                    placeholder="End date"
                    value={yearRange.end}
                    onChange={(e) => setYearRange({ ...yearRange, end: e.target.value })}
                  />
                </div>
                
                {(selectedYear !== 'all' || yearRange.start || yearRange.end) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedYear('all');
                      setYearRange({ start: '', end: '' });
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registry Results</CardTitle>
                  <CardDescription>
                    {error ? 'Error loading data' : isLoading ? 'Loading societies...' : `Found ${filteredSocieties.length} societies`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Societies</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : filteredSocieties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No societies found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedYear !== 'all' || yearRange.start || yearRange.end
                      ? 'Try adjusting your search criteria or filters'
                      : 'No societies are currently available in the registry'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPaginatedSocieties().map((society, index) => (
                    <motion.div
                      key={society.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <SocietyCard society={society} />
                    </motion.div>
                  ))}
                  
                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-6 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredSocieties.length)} of {filteredSocieties.length} societies
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                          disabled={currentPage === getTotalPages()}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Society View Modal */}
      <Dialog open={showSocietyDetails} onOpenChange={setShowSocietyDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Society Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedSociety?.registered_name || 'this society'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSociety && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Society Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Society Name:</span>
                      <div className="text-sm mt-1">{selectedSociety.registered_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Registration Number:</span>
                      <div className="font-mono text-sm mt-1">{selectedSociety.registration_number || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Registration Date:</span>
                      <div className="text-sm mt-1">{formatDate(selectedSociety.registration_date)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                      <div className="text-sm mt-1">{formatDate(selectedSociety.updated_at)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSocietyDetails(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    const societyData = [
                      selectedSociety.registration_number || '',
                      selectedSociety.registered_name || '',
                      selectedSociety.registration_date || ''
                    ].map(field => `"${field}"`).join(',');
                    
                    const csvContent = [
                      'Registration Number,Society Name,Registration Date',
                      societyData
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `society-${selectedSociety.registration_number || 'details'}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}