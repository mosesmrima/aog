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
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  case_parties: string | null;
  nature_of_claim_new: string | null;
  nature_of_claim_old: string | null;
  current_case_status: string | null;
  potential_liability_kshs: string | null;
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
  
  // Statistics
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    concludedCases: 0,
    totalLiability: 0,
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
          case_parties,
          nature_of_claim_new,
          nature_of_claim_old,
          current_case_status,
          potential_liability_kshs,
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
      
      // Calculate total potential liability
      const totalLiability = casesData.reduce((sum, case_) => {
        if (case_.potential_liability_kshs) {
          const amount = parseFloat(case_.potential_liability_kshs.replace(/[,'"]/g, ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }
        return sum;
      }, 0);
      
      setStats({
        totalCases,
        activeCases,
        concludedCases,
        totalLiability,
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
        case_.case_parties?.toLowerCase().includes(query) ||
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

  const formatLiability = (liability: string | null) => {
    if (!liability) return 'N/A';
    const amount = parseFloat(liability.replace(/[,'"]/g, ''));
    if (isNaN(amount)) return liability;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalCases}</div>
                <div className="text-blue-200 text-sm">Total Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeCases}</div>
                <div className="text-blue-200 text-sm">Active Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.thisYear}</div>
                <div className="text-blue-200 text-sm">This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  KES {formatLargeNumber(stats.totalLiability)}
                </div>
                <div className="text-blue-200 text-sm">Total Liability</div>
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
                    placeholder="Search cases by AG reference, parties, court station, status, or nature of claim..."
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
                  {filteredCases.map((case_, index) => (
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
                                <Badge className={getStatusColor(case_.current_case_status)}>
                                  {case_.current_case_status || 'Unknown Status'}
                                </Badge>
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
                              {case_.case_parties && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700 block mb-1">Parties:</span>
                                  <p className="text-gray-600 text-xs leading-relaxed">
                                    {case_.case_parties.length > 100 
                                      ? `${case_.case_parties.substring(0, 100)}...` 
                                      : case_.case_parties
                                    }
                                  </p>
                                </div>
                              )}
                              
                              {case_.potential_liability_kshs && (
                                <div className="text-sm mt-3">
                                  <span className="font-medium text-gray-700 block mb-1">Potential Liability:</span>
                                  <div className="flex items-center text-green-600 font-medium">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {formatLiability(case_.potential_liability_kshs)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}