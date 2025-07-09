'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Scale, 
  Search, 
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Eye,
  CheckCircle,
  Filter,
  Download,
  BarChart3,
  Users,
  FileText,
  Building,
  Globe,
  ExternalLink,
  Heart,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [trustees, setTrustees] = useState<PublicTrustee[]>([]);
  const [filteredTrustees, setFilteredTrustees] = useState<PublicTrustee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedTrustee, setSelectedTrustee] = useState<PublicTrustee | null>(null);
  const [showTrusteeDetails, setShowTrusteeDetails] = useState(false);
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

  useEffect(() => {
    loadTrustees();
  }, [loadTrustees]);

  useEffect(() => {
    // Debounce search and filters to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (searchQuery || selectedCounties.length > 0 || selectedYears.length > 0 || selectedGenders.length > 0) {
        loadFilteredTrustees();
      } else {
        setFilteredTrustees(trustees);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCounties, selectedYears, selectedGenders, loadFilteredTrustees, trustees]);

  useEffect(() => {
    // Update filtered results when base trustees data changes
    if (!searchQuery && selectedCounties.length === 0 && selectedYears.length === 0 && selectedGenders.length === 0) {
      setFilteredTrustees(trustees);
    }
  }, [trustees, searchQuery, selectedCounties, selectedYears, selectedGenders]);

  const loadTrustees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load trustees with pagination for better performance
      // Only select the fields needed for public registry
      const { data, error, count } = await supabase
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(500); // Load first 500 records

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
      // Get statistics directly from database
      const { data: countData } = await supabase
        .from('public_trustees')
        .select('gender, file_year, county, date_of_death', { count: 'exact' });
        
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
        .order('created_at', { ascending: false })
        .limit(1000); // Increase limit for search results

      // Apply text search - only on searchable fields
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query = query.or(`pt_cause_no.ilike.%${searchTerm}%,folio_no.ilike.%${searchTerm}%,deceased_name.ilike.%${searchTerm}%`);
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
      // Fallback to client-side filtering
      let filtered = [...trustees];
      
      // Text search across searchable fields only
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
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
  }, [searchQuery, selectedCounties, selectedGenders, selectedYears, trustees]);

  const applyClientSideFilters = useCallback(() => {
    let filtered = [...trustees];
    
    // Text search across searchable fields only
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
  }, [trustees, searchQuery, selectedCounties, selectedGenders, selectedYears]);

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
      .map(([county, count]) => ({
        county,
        count,
        total: maxCount
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getYearDistribution = () => {
    const yearCounts = trustees.reduce((acc, trustee) => {
      if (trustee.file_year) {
        acc[trustee.file_year] = (acc[trustee.file_year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    const maxCount = Math.max(...Object.values(yearCounts));
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({
        year: parseInt(year),
        count,
        total: maxCount
      }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);
  };

  const TrusteeCard = ({ trustee }: { trustee: PublicTrustee }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {trustee.deceased_name || 'Name not available'}
              </h3>
              <div className="flex items-center space-x-2">
                {trustee.gender && (
                  <Badge className={getGenderColor(trustee.gender)}>
                    {trustee.gender}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://publictrustee.ecitizen.go.ke/', '_blank')}
                  className="flex items-center space-x-1"
                >
                  <span>Further Enquiries</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span className="font-medium">PT Cause No:</span>
                <span className="ml-1 font-mono">{trustee.pt_cause_no || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span className="font-medium">Folio No:</span>
                <span className="ml-1 font-mono">{trustee.folio_no || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">Date of Death:</span>
                <span className="ml-1">{formatDate(trustee.date_of_death)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm">
              <span className="font-medium text-gray-700 block mb-1">County:</span>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{trustee.county || 'Not specified'}</span>
              </div>
            </div>
            
            {trustee.file_year && (
              <div className="text-sm mt-3">
                <span className="font-medium text-gray-700 block mb-1">File Year:</span>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  {trustee.file_year}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end">
            <Alert className="bg-blue-50 border-blue-200">
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-medium mb-1">Need more information?</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Visit the official Public Trustee portal for detailed enquiries and services.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://publictrustee.ecitizen.go.ke/', '_blank')}
                    className="text-xs"
                  >
                    Visit eCitizen Portal
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/registries" 
              className="inline-flex items-center text-indigo-100 hover:text-white transition-colors mb-6"
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
                <h1 className="text-4xl font-bold text-white mb-2">Public Trustees Registry</h1>
                <p className="text-indigo-100">Search deceased estates and public trustee records</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{formatLargeNumber(stats.totalTrustees)}</div>
                <div className="text-indigo-200 text-sm">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.maleCount}</div>
                <div className="text-indigo-200 text-sm">Male</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.femaleCount}</div>
                <div className="text-indigo-200 text-sm">Female</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.thisYear}</div>
                <div className="text-indigo-200 text-sm">This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.avgPerYear}</div>
                <div className="text-indigo-200 text-sm">Avg Per Year</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.topCounty}</div>
                <div className="text-indigo-200 text-sm">Top County</div>
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
          <div className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by PT Cause No, Folio No, or Name of the Deceased..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                    
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredTrustees.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Limited Search:</strong> For privacy and security reasons, you can only search by PT Cause No, Folio No, and Name of the Deceased. 
                    For detailed enquiries and additional services, please visit the{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:text-blue-800"
                      onClick={() => window.open('https://publictrustee.ecitizen.go.ke/', '_blank')}
                    >
                      official eCitizen portal
                    </Button>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Filters Panel */}
            {isFiltersOpen && (
              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* County Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">County</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getUniqueCounties().map((county) => (
                          <div key={county} className="flex items-center space-x-2">
                            <Checkbox
                              id={`county-${county}`}
                              checked={selectedCounties.includes(county)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCounties([...selectedCounties, county]);
                                } else {
                                  setSelectedCounties(selectedCounties.filter(c => c !== county));
                                }
                              }}
                            />
                            <Label htmlFor={`county-${county}`} className="text-sm">{county}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gender Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Gender</Label>
                      <div className="space-y-2">
                        {['MALE', 'FEMALE'].map((gender) => (
                          <div key={gender} className="flex items-center space-x-2">
                            <Checkbox
                              id={`gender-${gender}`}
                              checked={selectedGenders.includes(gender)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedGenders([...selectedGenders, gender]);
                                } else {
                                  setSelectedGenders(selectedGenders.filter(g => g !== gender));
                                }
                              }}
                            />
                            <Label htmlFor={`gender-${gender}`} className="text-sm">{gender}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Year Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">File Year</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getUniqueYears().map((year) => (
                          <div key={year} className="flex items-center space-x-2">
                            <Checkbox
                              id={`year-${year}`}
                              checked={selectedYears.includes(year.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedYears([...selectedYears, year.toString()]);
                                } else {
                                  setSelectedYears(selectedYears.filter(y => y !== year.toString()));
                                }
                              }}
                            />
                            <Label htmlFor={`year-${year}`} className="text-sm">{year}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCounties([]);
                        setSelectedGenders([]);
                        setSelectedYears([]);
                      }}
                    >
                      Clear All
                    </Button>
                    <Button onClick={() => setIsFiltersOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Public Trustees Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Statistical insights from the public trustees registry database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Gender Distribution */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800">Gender Split</h4>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {stats.totalTrustees > 0 ? Math.round((stats.maleCount / stats.totalTrustees) * 100) : 0}%M
                    </div>
                    <p className="text-sm text-blue-600">
                      {stats.maleCount} male, {stats.femaleCount} female
                    </p>
                  </CardContent>
                </Card>

                {/* Time Range */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">Time Range</h4>
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {stats.latestYear - stats.earliestYear + 1} years
                    </div>
                    <p className="text-sm text-green-600">
                      {stats.earliestYear} - {stats.latestYear}
                    </p>
                  </CardContent>
                </Card>

                {/* Top County */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800">Top County</h4>
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-700 truncate">
                      {stats.topCounty}
                    </div>
                    <p className="text-sm text-purple-600">
                      Most estates recorded
                    </p>
                  </CardContent>
                </Card>

                {/* Annual Average */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-amber-800">Annual Avg</h4>
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700">
                      {stats.avgPerYear}
                    </div>
                    <p className="text-sm text-amber-600">
                      Records per year
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trends Section */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Top Counties
                    </h4>
                    <div className="space-y-2">
                      {getCountyDistribution().map((county) => (
                        <div key={county.county} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate max-w-xs" title={county.county}>
                            {county.county}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-indigo-500 rounded" 
                              style={{ width: `${(county.count / county.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{county.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Recent Years
                    </h4>
                    <div className="space-y-2">
                      {getYearDistribution().map((year) => (
                        <div key={year.year} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {year.year}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-purple-500 rounded" 
                              style={{ width: `${(year.count / year.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{year.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                    {error ? 'Error loading data' : isLoading ? 'Loading trustees...' : `Found ${filteredTrustees.length} trustee records`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scale className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Trustees</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredTrustees.length === 0 ? (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trustee records found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedCounties.length > 0 || selectedGenders.length > 0 || selectedYears.length > 0
                      ? 'Try adjusting your search criteria or filters'
                      : 'No trustee records are currently available in the registry'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPaginatedTrustees().map((trustee, index) => (
                    <motion.div
                      key={trustee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TrusteeCard trustee={trustee} />
                    </motion.div>
                  ))}
                  
                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-6 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTrustees.length)} of {filteredTrustees.length} trustees
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
    </div>
  );
}