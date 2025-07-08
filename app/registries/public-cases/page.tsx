'use client';

import { useState, useEffect } from 'react';
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
  Eye,
  Filter,
  Download,
  BarChart3,
  MapPin,
  Gavel,
  CheckCircle
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
import { supabase } from '@/lib/supabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { landCasesThematicData, getTopLandCaseCategories, totalLandCases } from '@/lib/land-cases-data';

interface GovernmentCase {
  id: string;
  ag_file_reference: string | null;
  court_station: string | null;
  court_rank: string | null;
  case_no: string | null;
  case_year: number | null;
  nature_of_claim_new: string | null;
  nature_of_claim_old: string | null;
  current_case_status: string | null;
  region: string | null;
  ministry: string | null;
  created_at: string;
}

export default function PublicCasesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<GovernmentCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<GovernmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Filter states
  const [selectedCourtStations, setSelectedCourtStations] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedLandThemes, setSelectedLandThemes] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<GovernmentCase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Statistics
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    concludedCases: 0,
    thisYear: 0,
    avgProcessingTime: '12-18 months'
  });

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cases, searchQuery, selectedCourtStations, selectedYears, selectedStatuses, selectedClaims, selectedRegions, selectedLandThemes]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      
      // Load cases without RLS restrictions for public view
      const { data, error } = await supabase
        .from('government_cases')
        .select(`
          id,
          ag_file_reference,
          court_station,
          court_rank,
          case_no,
          case_year,
          nature_of_claim_new,
          nature_of_claim_old,
          current_case_status,
          region,
          ministry,
          created_at
        `)
        .order('case_year', { ascending: false });

      if (error) throw error;
      
      const casesData = data || [];
      setCases(casesData);
      
      // Calculate statistics
      const totalCases = casesData.length;
      const activeCases = casesData.filter(c => 
        c.current_case_status && 
        !c.current_case_status.toLowerCase().includes('concluded') &&
        !c.current_case_status.toLowerCase().includes('closed')
      ).length;
      const concludedCases = casesData.filter(c => 
        c.current_case_status && 
        (c.current_case_status.toLowerCase().includes('concluded') ||
         c.current_case_status.toLowerCase().includes('closed'))
      ).length;
      
      const currentYear = new Date().getFullYear();
      const thisYear = casesData.filter(c => c.case_year === currentYear).length;
      
      setStats({
        totalCases,
        activeCases,
        concludedCases,
        thisYear,
        avgProcessingTime: '12-18 months'
      });
      
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];
    
    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(case_ =>
        case_.ag_file_reference?.toLowerCase().includes(query) ||
        case_.court_station?.toLowerCase().includes(query) ||
        case_.nature_of_claim_new?.toLowerCase().includes(query) ||
        case_.nature_of_claim_old?.toLowerCase().includes(query) ||
        case_.current_case_status?.toLowerCase().includes(query) ||
        case_.case_no?.toLowerCase().includes(query)
      );
    }
    
    // Filter by court stations
    if (selectedCourtStations.length > 0) {
      filtered = filtered.filter(case_ => 
        case_.court_station && selectedCourtStations.includes(case_.court_station)
      );
    }
    
    // Filter by years
    if (selectedYears.length > 0) {
      filtered = filtered.filter(case_ => 
        case_.case_year && selectedYears.includes(case_.case_year.toString())
      );
    }
    
    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(case_ => 
        case_.current_case_status && selectedStatuses.some(status => 
          case_.current_case_status!.toLowerCase().includes(status.toLowerCase())
        )
      );
    }
    
    // Filter by nature of claim
    if (selectedClaims.length > 0) {
      filtered = filtered.filter(case_ => 
        (case_.nature_of_claim_new && selectedClaims.includes(case_.nature_of_claim_new)) ||
        (case_.nature_of_claim_old && selectedClaims.includes(case_.nature_of_claim_old))
      );
    }
    
    // Filter by region
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(case_ => 
        case_.region && selectedRegions.includes(case_.region)
      );
    }
    
    // Filter by land themes
    if (selectedLandThemes.length > 0) {
      filtered = filtered.filter(case_ => {
        const caseNature = (case_.nature_of_claim_new || case_.nature_of_claim_old || '').toLowerCase();
        return selectedLandThemes.some(theme => 
          caseNature.includes(theme.toLowerCase()) ||
          landCasesThematicData.some(landTheme => 
            landTheme.theme.toLowerCase() === theme.toLowerCase() &&
            caseNature.includes(landTheme.theme.toLowerCase().split(' ')[0])
          )
        );
      });
    }
    
    setFilteredCases(filtered);
  };

  const getUniqueValues = (field: keyof GovernmentCase) => {
    return Array.from(new Set(
      cases
        .map(case_ => case_[field])
        .filter(value => value && value.toString().trim() !== '')
    )).sort();
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('judgment') || lowerStatus.includes('concluded')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('hearing')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus.includes('appeal') || lowerStatus.includes('closed')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const exportToCSV = () => {
    const headers = [
      'AG File Reference',
      'Court Station', 
      'Case Number',
      'Case Year',
      'Nature of Claim',
      'Case Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredCases.map(case_ => [
        case_.ag_file_reference || '',
        case_.court_station || '',
        case_.case_no || '',
        case_.case_year || '',
        case_.nature_of_claim_new || case_.nature_of_claim_old || '',
        case_.current_case_status || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `government-cases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTopCourtStation = () => {
    const courtCounts = cases.reduce((acc, case_) => {
      if (case_.court_station) {
        acc[case_.court_station] = (acc[case_.court_station] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topCourt = Object.entries(courtCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCourt ? topCourt[0] : 'N/A';
  };

  const getYearlyDistribution = () => {
    const yearCounts = cases.reduce((acc, case_) => {
      if (case_.case_year) {
        acc[case_.case_year] = (acc[case_.case_year] || 0) + 1;
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
      .sort((a, b) => b.year - a.year);
  };

  const getTopClaims = () => {
    const claimCounts = cases.reduce((acc, case_) => {
      const claim = case_.nature_of_claim_new || case_.nature_of_claim_old;
      if (claim) {
        acc[claim] = (acc[claim] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(claimCounts));
    
    return Object.entries(claimCounts)
      .map(([claim, count]) => ({
        claim,
        count,
        total: maxCount
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getPaginatedCases = (): GovernmentCase[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCases.slice(startIndex, endIndex);
  };

  const getTotalPages = (): number => {
    return Math.ceil(filteredCases.length / itemsPerPage);
  };

  const getPageNumbers = (): number[] => {
    const totalPages = getTotalPages();
    const current = currentPage;
    const delta = 2;
    
    let start = Math.max(1, current - delta);
    let end = Math.min(totalPages, current + delta);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

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
                <h1 className="text-4xl font-bold text-white mb-2">Public Cases Registry</h1>
                <p className="text-blue-100">Legal cases filed against government departments and ministries</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalCases}</div>
                <div className="text-blue-200 text-sm">Total Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeCases}</div>
                <div className="text-blue-200 text-sm">Active Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.concludedCases}</div>
                <div className="text-blue-200 text-sm">Concluded Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{totalLandCases.toLocaleString()}</div>
                <div className="text-blue-200 text-sm">Land Cases</div>
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
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cases by AG reference, court station, status, or nature of claim..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="absolute top-full left-0 right-0 z-10 mt-2">
                      <Card className="border shadow-lg">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Court Stations Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Court Station</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('court_station').map((station) => (
                                  <div key={station} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`station-${station}`}
                                      checked={selectedCourtStations.includes(station as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedCourtStations([...selectedCourtStations, station as string]);
                                        } else {
                                          setSelectedCourtStations(selectedCourtStations.filter(s => s !== station));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`station-${station}`} className="text-sm">{station}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Years Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Case Year</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('case_year').reverse().map((year) => (
                                  <div key={year} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`year-${year}`}
                                      checked={selectedYears.includes(year?.toString() || '')}
                                      onCheckedChange={(checked) => {
                                        const yearStr = year?.toString() || '';
                                        if (checked) {
                                          setSelectedYears([...selectedYears, yearStr]);
                                        } else {
                                          setSelectedYears(selectedYears.filter(y => y !== yearStr));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`year-${year}`} className="text-sm">{year}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Nature of Claim Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Nature of Claim</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {Array.from(new Set([
                                  ...getUniqueValues('nature_of_claim_new'),
                                  ...getUniqueValues('nature_of_claim_old')
                                ])).sort().map((claim) => (
                                  <div key={claim} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`claim-${claim}`}
                                      checked={selectedClaims.includes(claim as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedClaims([...selectedClaims, claim as string]);
                                        } else {
                                          setSelectedClaims(selectedClaims.filter(c => c !== claim));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`claim-${claim}`} className="text-sm">{claim}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Land Themes Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Land Case Themes</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getTopLandCaseCategories(10).map((theme) => (
                                  <div key={theme.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`theme-${theme.id}`}
                                      checked={selectedLandThemes.includes(theme.theme)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedLandThemes([...selectedLandThemes, theme.theme]);
                                        } else {
                                          setSelectedLandThemes(selectedLandThemes.filter(t => t !== theme.theme));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`theme-${theme.id}`} className="text-xs">
                                      {theme.theme.length > 40 ? `${theme.theme.substring(0, 40)}...` : theme.theme}
                                      <span className="text-gray-500 ml-1">({theme.caseCount})</span>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedCourtStations([]);
                                setSelectedYears([]);
                                setSelectedStatuses([]);
                                setSelectedClaims([]);
                                setSelectedRegions([]);
                                setSelectedLandThemes([]);
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
                    </CollapsibleContent>
                  </Collapsible>
                  
                  <Button variant="outline" onClick={exportToCSV} disabled={filteredCases.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                Case Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Real-time insights and trends from the government cases database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Case Status Distribution */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">Resolution Rate</h4>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {stats.totalCases > 0 ? Math.round((stats.concludedCases / stats.totalCases) * 100) : 0}%
                    </div>
                    <p className="text-sm text-green-600">
                      {stats.concludedCases} of {stats.totalCases} cases concluded
                    </p>
                  </CardContent>
                </Card>

                {/* Top Court Station */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800">Top Court</h4>
                      <Gavel className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-700 truncate">
                      {getTopCourtStation()}
                    </div>
                    <p className="text-sm text-purple-600">
                      Most active jurisdiction
                    </p>
                  </CardContent>
                </Card>

                {/* Land Cases Percentage */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-amber-800">Land Cases</h4>
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700">
                      {stats.totalCases > 0 ? Math.round((totalLandCases / stats.totalCases) * 100) : 0}%
                    </div>
                    <p className="text-sm text-amber-600">
                      Of all government cases
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trends Section */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Case Distribution by Year
                    </h4>
                    <div className="space-y-2">
                      {getYearlyDistribution().slice(0, 5).map((year, index) => (
                        <div key={year.year} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{year.year}</span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-blue-500 rounded" 
                              style={{ width: `${(year.count / year.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{year.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Scale className="w-4 h-4 mr-2" />
                      Top Nature of Claims
                    </h4>
                    <div className="space-y-2">
                      {getTopClaims().slice(0, 5).map((claim, index) => (
                        <div key={claim.claim} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate max-w-xs" title={claim.claim}>
                            {claim.claim.length > 30 ? `${claim.claim.substring(0, 30)}...` : claim.claim}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-green-500 rounded" 
                              style={{ width: `${(claim.count / claim.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{claim.count}</span>
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
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    {isLoading ? 'Loading cases...' : `Found ${filteredCases.length} cases`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedCourtStations.length > 0 || selectedYears.length > 0 || selectedClaims.length > 0
                      ? 'Try adjusting your search criteria or filters'
                      : 'No public cases are currently available'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPaginatedCases().map((case_, index) => (
                    <motion.div
                      key={case_.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {case_.ag_file_reference || 'No AG Reference'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(case_.current_case_status)}>
                                    {case_.current_case_status || 'Unknown Status'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCase(case_);
                                      setShowCaseDetails(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Building className="w-4 h-4 mr-2" />
                                  <span className="font-medium">Court:</span>
                                  <span className="ml-1">
                                    {case_.court_station || 'N/A'} {case_.court_rank ? `(${case_.court_rank})` : ''}
                                  </span>
                                </div>
                                
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  <span className="font-medium">Case No:</span>
                                  <span className="ml-1">{case_.case_no || 'N/A'}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span className="font-medium">Year:</span>
                                  <span className="ml-1">{case_.case_year || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700 block mb-1">Nature of Claim:</span>
                                <span className="text-gray-600">
                                  {case_.nature_of_claim_new || case_.nature_of_claim_old || 'Not specified'}
                                </span>
                              </div>
                              
                              {case_.region && (
                                <div className="text-sm mt-3">
                                  <span className="font-medium text-gray-700 block mb-1">Region:</span>
                                  <div className="flex items-center text-gray-600">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {case_.region}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              {case_.ministry && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700 block mb-1">Ministry:</span>
                                  <p className="text-gray-600 text-xs leading-relaxed">
                                    {case_.ministry}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-6 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
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
                            const pageNum = getPageNumbers()[i];
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

      {/* Detailed Case View Modal */}
      <Dialog open={showCaseDetails} onOpenChange={setShowCaseDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Case Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedCase?.ag_file_reference || 'this case'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6">
              {/* Case Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">AG File Reference:</span>
                      <div className="font-mono text-sm mt-1">{selectedCase.ag_file_reference || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Case Number:</span>
                      <div className="font-mono text-sm mt-1">{selectedCase.case_no || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Case Year:</span>
                      <div className="text-sm mt-1">{selectedCase.case_year || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Current Status:</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedCase.current_case_status)}>
                          {selectedCase.current_case_status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Court Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Court Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Court Station:</span>
                      <div className="text-sm mt-1">{selectedCase.court_station || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Court Rank:</span>
                      <div className="text-sm mt-1">{selectedCase.court_rank || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Region:</span>
                      <div className="text-sm mt-1 flex items-center">
                        {selectedCase.region ? (
                          <>
                            <MapPin className="w-3 h-3 mr-1" />
                            {selectedCase.region}
                          </>
                        ) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ministry:</span>
                      <div className="text-sm mt-1">{selectedCase.ministry || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Case Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nature of Claim (New):</span>
                      <div className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                        {selectedCase.nature_of_claim_new || 'Not specified'}
                      </div>
                    </div>
                    
                    {selectedCase.nature_of_claim_old && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nature of Claim (Original):</span>
                        <div className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                          {selectedCase.nature_of_claim_old}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCaseDetails(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    const caseData = [
                      selectedCase.ag_file_reference || '',
                      selectedCase.court_station || '',
                      selectedCase.case_no || '',
                      selectedCase.case_year || '',
                      selectedCase.nature_of_claim_new || selectedCase.nature_of_claim_old || '',
                      selectedCase.current_case_status || ''
                    ].map(field => `"${field}"`).join(',');
                    
                    const csvContent = [
                      'AG File Reference,Court Station,Case Number,Case Year,Nature of Claim,Case Status',
                      caseData
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `case-${selectedCase.ag_file_reference || 'details'}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}