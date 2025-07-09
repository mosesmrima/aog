'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Scale, 
  Search, 
  ArrowLeft,
  Calendar,
  MapPin,
  Filter,
  Download,
  BarChart3,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

interface PublicTrustee {
  id: string;
  pt_cause_no: string | null;
  folio_no: string | null;
  deceased_name: string | null;
  gender: string | null;
  county: string | null;
  date_of_death: string | null;
  file_year: number | null;
  created_at: string;
}

export default function PublicTrusteesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [trustees, setTrustees] = useState<PublicTrustee[]>([]);
  const [filteredTrustees, setFilteredTrustees] = useState<PublicTrustee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Filter states
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  
  // Statistics
  const [stats, setStats] = useState({
    totalTrustees: 0,
    maleCount: 0,
    femaleCount: 0,
    thisYear: 0,
    avgPerYear: 0,
    topCounty: 'N/A',
    earliestYear: 0,
    latestYear: 0
  });

  // Debounced search implementation
  const debouncedSearch = useMemo(
    () => {
      const timeoutRef = { current: null as NodeJS.Timeout | null };
      
      return (value: string) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setDebouncedSearchQuery(value);
          setCurrentPage(1); // Reset to first page when searching
        }, 300); // 300ms delay
      };
    },
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const loadTrustees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load trustees with quality filtering for public registry
      // Only select the fields needed for public registry
      const { data, error } = await supabase
        .from('public_trustees')
        .select(`
          id,
          pt_cause_no,
          folio_no,
          deceased_name,
          gender,
          county,
          date_of_death,
          file_year,
          created_at
        `)
        // Filter out low-quality and auto-generated records
        .not('deceased_name', 'is', null)
        .neq('deceased_name', '')
        .neq('deceased_name', '-')
        .gte('data_quality_score', 60)
        .not('pt_cause_no', 'like', 'IMPORT_%')
        .not('pt_cause_no', 'like', 'AUTO_%')
        .order('created_at', { ascending: false })
        .limit(1000); // Increased limit for better search coverage

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to load trustees: ${error.message}`);
      }
      
      const trusteesData = data || [];
      setTrustees(trusteesData);
      
      // Load statistics from database for accuracy
      await loadStatistics();
      
    } catch (error) {
      console.error('Error loading trustees:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trustees data');
      // Set empty state to show user there's an issue
      setTrustees([]);
      setStats({
        totalTrustees: 0,
        maleCount: 0,
        femaleCount: 0,
        thisYear: 0,
        avgPerYear: 0,
        topCounty: 'Error loading data',
        earliestYear: 0,
        latestYear: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatistics = async () => {
    try {
      // Get statistics directly from database with quality filtering
      const { data: countData } = await supabase
        .from('public_trustees')
        .select('gender, file_year, county, date_of_death')
        // Apply same quality filters for statistics
        .not('deceased_name', 'is', null)
        .neq('deceased_name', '')
        .neq('deceased_name', '-')
        .gte('data_quality_score', 60)
        .not('pt_cause_no', 'like', 'IMPORT_%')
        .not('pt_cause_no', 'like', 'AUTO_%');
        
      if (countData) {
        const totalTrustees = countData.length;
        
        const maleCount = countData.filter(t => t.gender === 'MALE').length;
        const femaleCount = countData.filter(t => t.gender === 'FEMALE').length;
        
        const currentYear = new Date().getFullYear();
        const thisYear = countData.filter(t => 
          t.file_year === currentYear
        ).length;
        
        const years = countData.map(t => t.file_year).filter(y => y);
        const earliestYear = Math.min(...years);
        const latestYear = Math.max(...years);
        const yearRange = latestYear - earliestYear + 1;
        const avgPerYear = yearRange > 0 ? Math.round(totalTrustees / yearRange) : 0;
        
        // Get top county
        const countyCount = countData.reduce((acc, trustee) => {
          if (trustee.county) {
            acc[trustee.county] = (acc[trustee.county] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const topCounty = Object.entries(countyCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        
        setStats({
          totalTrustees,
          maleCount,
          femaleCount,
          thisYear,
          avgPerYear,
          topCounty,
          earliestYear,
          latestYear
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadFilteredTrustees = useCallback(async () => {
    try {
      let query = supabase
        .from('public_trustees')
        .select(`
          id,
          pt_cause_no,
          folio_no,
          deceased_name,
          gender,
          county,
          date_of_death,
          file_year,
          created_at
        `)
        // Apply quality filters first
        .not('deceased_name', 'is', null)
        .neq('deceased_name', '')
        .neq('deceased_name', '-')
        .gte('data_quality_score', 60)
        .not('pt_cause_no', 'like', 'IMPORT_%')
        .not('pt_cause_no', 'like', 'AUTO_%')
        .order('created_at', { ascending: false });

      // Apply text search - improved case-insensitive search using debounced query
      if (debouncedSearchQuery.trim()) {
        const searchTerm = debouncedSearchQuery.trim();
        
        // Check if it's likely a number (for PT cause no or folio no)
        if (/^\d+$/.test(searchTerm)) {
          // For numbers, prioritize pt_cause_no and folio_no with partial matching
          query = query.or(`pt_cause_no.ilike.%${searchTerm}%,folio_no.ilike.%${searchTerm}%,deceased_name.ilike.%${searchTerm}%`);
        } else {
          // For text, use case-insensitive partial matching across all searchable fields
          query = query.or(`pt_cause_no.ilike.%${searchTerm}%,folio_no.ilike.%${searchTerm}%,deceased_name.ilike.%${searchTerm}%`);
        }
      }

      // Apply county filter
      if (selectedCounties.length > 0) {
        query = query.in('county', selectedCounties);
      }

      // Apply gender filter
      if (selectedGenders.length > 0) {
        query = query.in('gender', selectedGenders);
      }

      // Apply year filter
      if (selectedYears.length > 0) {
        query = query.in('file_year', selectedYears.map(y => parseInt(y)));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setFilteredTrustees(data || []);
      
    } catch (error) {
      console.error('Error filtering trustees:', error);
      // Fallback to client-side filtering with quality filtering
      let filtered = [...trustees];
      
      // Apply quality filters first
      filtered = filtered.filter(trustee => 
        trustee.deceased_name && 
        trustee.deceased_name !== '' && 
        trustee.deceased_name !== '-' &&
        trustee.pt_cause_no &&
        !trustee.pt_cause_no.startsWith('IMPORT_') &&
        !trustee.pt_cause_no.startsWith('AUTO_')
      );
      
      // Text search across searchable fields with improved matching using debounced query
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(trustee =>
          trustee.pt_cause_no?.toLowerCase().includes(query) ||
          trustee.folio_no?.toLowerCase().includes(query) ||
          trustee.deceased_name?.toLowerCase().includes(query)
        );
      }
      
      // Filter by county
      if (selectedCounties.length > 0) {
        filtered = filtered.filter(trustee => 
          trustee.county && selectedCounties.includes(trustee.county)
        );
      }
      
      // Filter by gender
      if (selectedGenders.length > 0) {
        filtered = filtered.filter(trustee => 
          trustee.gender && selectedGenders.includes(trustee.gender)
        );
      }
      
      // Filter by year
      if (selectedYears.length > 0) {
        filtered = filtered.filter(trustee => 
          trustee.file_year && selectedYears.includes(trustee.file_year.toString())
        );
      }
      
      setFilteredTrustees(filtered);
    }
  }, [debouncedSearchQuery, selectedCounties, selectedGenders, selectedYears, trustees]);

  useEffect(() => {
    loadTrustees();
  }, [loadTrustees]);

  useEffect(() => {
    // Load filtered trustees when debounced search or filters change
    if (debouncedSearchQuery || selectedCounties.length > 0 || selectedYears.length > 0 || selectedGenders.length > 0) {
      loadFilteredTrustees();
    } else {
      setFilteredTrustees(trustees);
    }
  }, [debouncedSearchQuery, selectedCounties, selectedYears, selectedGenders, loadFilteredTrustees, trustees]);

  useEffect(() => {
    // Update filtered results when base trustees data changes
    if (!debouncedSearchQuery && selectedCounties.length === 0 && selectedYears.length === 0 && selectedGenders.length === 0) {
      setFilteredTrustees(trustees);
    }
  }, [trustees, debouncedSearchQuery, selectedCounties, selectedYears, selectedGenders]);

  const getUniqueCounties = () => {
    return Array.from(new Set(
      trustees
        .map(trustee => trustee.county)
        .filter(county => county && county.trim() !== '')
    )).sort();
  };

  const getUniqueYears = () => {
    return Array.from(new Set(
      trustees
        .map(trustee => trustee.file_year)
        .filter(year => year)
    )).sort((a, b) => b - a);
  };

  const getGenderColor = (gender: string | null) => {
    if (!gender) return 'bg-gray-100 text-gray-800';
    
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male') return 'bg-blue-100 text-blue-800';
    if (lowerGender === 'female') return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const exportToCSV = () => {
    const headers = [
      'PT Cause No',
      'Folio No', 
      'Deceased Name',
      'Gender',
      'County',
      'Date of Death',
      'File Year'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredTrustees.map(trustee => [
        trustee.pt_cause_no || '',
        trustee.folio_no || '',
        trustee.deceased_name || '',
        trustee.gender || '',
        trustee.county || '',
        trustee.date_of_death || '',
        trustee.file_year || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `public-trustees-registry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPaginatedTrustees = (): PublicTrustee[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTrustees.slice(startIndex, endIndex);
  };

  const getTotalPages = (): number => {
    return Math.ceil(filteredTrustees.length / itemsPerPage);
  };

  const getCountyDistribution = () => {
    const countyCounts = trustees.reduce((acc, trustee) => {
      if (trustee.county) {
        acc[trustee.county] = (acc[trustee.county] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(countyCounts));
    
    return Object.entries(countyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([county, count]) => ({
        county,
        count,
        percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
      }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCounties([]);
    setSelectedYears([]);
    setSelectedGenders([]);
    setCurrentPage(1);
  };

  const uniqueCounties = getUniqueCounties();
  const uniqueYears = getUniqueYears();
  const paginatedTrustees = getPaginatedTrustees();
  const totalPages = getTotalPages();
  const countyDistribution = getCountyDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <Link 
                href="/registries" 
                className="inline-flex items-center text-blue-100 hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Registries
              </Link>
              <Image
                src="/oag-logo.png"
                alt="Office of the Attorney General"
                width={200}
                height={50}
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Public Trustees Registry
              </h1>
            </div>
            
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
              Search deceased estates and public trustee records. Limited to PT Cause No, Folio No, and Name of the Deceased.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-blue-100">
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {formatLargeNumber(stats.totalTrustees)}
                </div>
                <div className="text-sm">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {stats.earliestYear} - {stats.latestYear}
                </div>
                <div className="text-sm">Year Range</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {stats.topCounty}
                </div>
                <div className="text-sm">Most Common County</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Public Trustees
              </CardTitle>
              <CardDescription>
                Search by PT Cause No, Folio No, or Name of the Deceased only. 
                For detailed inquiries, visit{' '}
                <a 
                  href="https://publictrustee.ecitizen.go.ke/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  Public Trustee eCitizen Portal
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by PT Cause No, Folio No, or Name of the Deceased..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Additional Filters</span>
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {filteredTrustees.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={exportToCSV}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Results</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={!searchQuery && selectedCounties.length === 0 && selectedYears.length === 0 && selectedGenders.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Expanded Filters */}
                {isFiltersOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"
                  >
                    {/* County Filter */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Filter by County</label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        {uniqueCounties.map(county => (
                          <div key={county} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`county-${county}`}
                              checked={selectedCounties.includes(county)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCounties([...selectedCounties, county]);
                                } else {
                                  setSelectedCounties(selectedCounties.filter(c => c !== county));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`county-${county}`} className="text-sm">
                              {county}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gender Filter */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Filter by Gender</label>
                      <div className="space-y-2">
                        {['MALE', 'FEMALE'].map(gender => (
                          <div key={gender} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`gender-${gender}`}
                              checked={selectedGenders.includes(gender)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGenders([...selectedGenders, gender]);
                                } else {
                                  setSelectedGenders(selectedGenders.filter(g => g !== gender));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`gender-${gender}`} className="text-sm">
                              {gender}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Year Filter */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Filter by Year</label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        {uniqueYears.slice(0, 10).map(year => (
                          <div key={year} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`year-${year}`}
                              checked={selectedYears.includes(year.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedYears([...selectedYears, year.toString()]);
                                } else {
                                  setSelectedYears(selectedYears.filter(y => y !== year.toString()));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`year-${year}`} className="text-sm">
                              {year}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading trustee records...</span>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Search Results</span>
                  <Badge variant="secondary">
                    {filteredTrustees.length} records found
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {filteredTrustees.length === 0 ? (
                    "No records found matching your search criteria"
                  ) : (
                    `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredTrustees.length)} of ${filteredTrustees.length} records`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTrustees.length === 0 ? (
                  <div className="text-center py-12">
                    <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No trustee records found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3 font-semibold text-gray-900">PT Cause No</th>
                            <th className="p-3 font-semibold text-gray-900">Folio No</th>
                            <th className="p-3 font-semibold text-gray-900">Name of the Deceased</th>
                            <th className="p-3 font-semibold text-gray-900">Gender</th>
                            <th className="p-3 font-semibold text-gray-900">County</th>
                            <th className="p-3 font-semibold text-gray-900">Date of Death</th>
                            <th className="p-3 font-semibold text-gray-900">File Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTrustees.map((trustee) => (
                            <tr key={trustee.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono text-sm">
                                {trustee.pt_cause_no || '-'}
                              </td>
                              <td className="p-3 font-mono text-sm">
                                {trustee.folio_no || '-'}
                              </td>
                              <td className="p-3 font-medium">
                                {trustee.deceased_name || '-'}
                              </td>
                              <td className="p-3">
                                <Badge className={getGenderColor(trustee.gender)}>
                                  {trustee.gender || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">
                                  {trustee.county || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {formatDate(trustee.date_of_death)}
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {trustee.file_year || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Page {currentPage} of {totalPages}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistics */}
        {!isLoading && !error && filteredTrustees.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Total Records</div>
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalTrustees.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Gender Split</div>
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalTrustees > 0 ? Math.round((stats.maleCount / stats.totalTrustees) * 100) : 0}% M
                </div>
                <div className="text-sm text-gray-500">
                  {stats.maleCount} male, {stats.femaleCount} female
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">This Year</div>
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.thisYear}
                </div>
                <div className="text-sm text-gray-500">
                  New records in {new Date().getFullYear()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Top County</div>
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-xl font-bold text-gray-900 truncate">
                  {stats.topCounty}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* County Distribution */}
        {!isLoading && !error && countyDistribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Top Counties by Record Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {countyDistribution.map(({ county, count, percentage }) => (
                    <div key={county} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-gray-900 truncate">
                        {county}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-16 text-right">
                        {count.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-8"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Need More Information?
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    This registry provides limited public information. For detailed estate information, 
                    legal documents, or to file claims, please visit the official Public Trustee portal.
                  </p>
                  <a
                    href="https://publictrustee.ecitizen.go.ke/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Visit Public Trustee eCitizen Portal
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}