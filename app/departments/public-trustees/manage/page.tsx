'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Scale,
  Users,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  User,
  Heart,
  Building
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { PublicTrusteesCSVImportDialog } from '@/components/public-trustees/csv-import-dialog';

interface PublicTrustee {
  id: string;
  pt_cause_no: string;
  folio_no: string;
  deceased_name: string;
  gender: string;
  marital_status: string;
  date_of_death: string;
  religion: string;
  county: string;
  station: string;
  assets: string;
  beneficiaries: string;
  telephone_no: string;
  date_of_advertisement: string;
  date_of_confirmation: string;
  date_account_drawn: string;
  date_payment_made: string;
  file_year: number;
  original_file_name: string;
  data_source: string;
  data_quality_score: number;
  missing_fields: string[];
  import_warnings: any;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 20;

export default function PublicTrusteesManagePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [trustees, setTrustees] = useState<PublicTrustee[]>([]);
  const [isLoadingTrustees, setIsLoadingTrustees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTrustees, setTotalTrustees] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTrustee, setSelectedTrustee] = useState<PublicTrustee | null>(null);
  const [hiddenRecordsCount, setHiddenRecordsCount] = useState(0);

  // Filter options
  const [counties, setCounties] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [dataSources, setDataSources] = useState<string[]>([]);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Debounced search implementation
  const debouncedSearch = useMemo(
    () => {
      const timeoutRef = { current: null as NodeJS.Timeout | null };
      
      return (value: string) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setDebouncedSearchTerm(value);
          setCurrentPage(1); // Reset to first page
        }, 300); // 300ms delay
      };
    },
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const loadTrustees = useCallback(async () => {
    try {
      setIsLoadingTrustees(true);
      
      let query = supabase
        .from('public_trustees')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filter out records without names and low quality records
      query = query
        .not('deceased_name', 'is', null)
        .neq('deceased_name', '')
        .neq('deceased_name', '-')
        .gte('data_quality_score', 60);

      // Apply robust search filters
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        const searchValue = debouncedSearchTerm.trim();
        
        // Check if it's likely a number (for PT cause no or folio no)
        if (/^\d+$/.test(searchValue)) {
          // For numbers, prioritize pt_cause_no and folio_no with partial matching
          query = query.or(`pt_cause_no.ilike.%${searchValue}%,folio_no.ilike.%${searchValue}%,deceased_name.ilike.%${searchValue}%`);
        } else {
          // For text, search across all relevant fields with partial matching
          query = query.or(`deceased_name.ilike.%${searchValue}%,pt_cause_no.ilike.%${searchValue}%,folio_no.ilike.%${searchValue}%,county.ilike.%${searchValue}%,station.ilike.%${searchValue}%,assets.ilike.%${searchValue}%,beneficiaries.ilike.%${searchValue}%`);
        }
      }
      
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }
      
      if (countyFilter !== 'all') {
        query = query.eq('county', countyFilter);
      }
      
      if (yearFilter !== 'all') {
        query = query.eq('file_year', parseInt(yearFilter));
      }
      
      if (sourceFilter !== 'all') {
        query = query.eq('data_source', sourceFilter);
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTrustees(data || []);
      setTotalTrustees(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
      // Get count of hidden records (those with no names or low quality scores)
      const { count: hiddenCount } = await supabase
        .from('public_trustees')
        .select('*', { count: 'exact', head: true })
        .or('deceased_name.is.null,deceased_name.eq.,deceased_name.eq.-,data_quality_score.lt.60');
      
      setHiddenRecordsCount(hiddenCount || 0);
    } catch (error) {
      console.error('Error loading trustees:', error);
      toast({
        title: "Error Loading Trustees",
        description: "Could not load trustees data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrustees(false);
    }
  }, [debouncedSearchTerm, genderFilter, countyFilter, yearFilter, sourceFilter, currentPage, toast]);

  const loadFilterOptions = useCallback(async () => {
    try {
      // Load unique counties
      const { data: countiesData } = await supabase
        .from('public_trustees')
        .select('county')
        .not('county', 'is', null);
      
      const uniqueCounties = Array.from(new Set(countiesData?.map(c => c.county) || [])).sort();
      setCounties(uniqueCounties);

      // Load unique years
      const { data: yearsData } = await supabase
        .from('public_trustees')
        .select('file_year')
        .not('file_year', 'is', null);
      
      const uniqueYears = Array.from(new Set(yearsData?.map(y => y.file_year) || [])).sort((a, b) => b - a);
      setYears(uniqueYears);

      // Load unique data sources
      const { data: sources } = await supabase
        .from('public_trustees')
        .select('data_source')
        .not('data_source', 'is', null);
      
      const uniqueSources = Array.from(new Set(sources?.map(s => s.data_source) || [])).sort();
      setDataSources(uniqueSources);

    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else if (!user.is_approved) {
        router.push('/pending');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_approved) {
      loadTrustees();
      loadFilterOptions();
    }
  }, [user, loadTrustees, loadFilterOptions]);

  const handleImportComplete = () => {
    // Reload trustees data after successful import
    loadTrustees();
  };

  const exportTrustees = async () => {
    try {
      // Get all trustees matching current filters (without pagination)
      let query = supabase
        .from('public_trustees')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply same filters as display (hide nameless records and low quality)
      query = query
        .not('deceased_name', 'is', null)
        .neq('deceased_name', '')
        .neq('deceased_name', '-')
        .gte('data_quality_score', 60);

      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        const searchValue = debouncedSearchTerm.trim();
        
        // Check if it's likely a number (for PT cause no or folio no)
        if (/^\d+$/.test(searchValue)) {
          // For numbers, prioritize pt_cause_no and folio_no with partial matching
          query = query.or(`pt_cause_no.ilike.%${searchValue}%,folio_no.ilike.%${searchValue}%,deceased_name.ilike.%${searchValue}%`);
        } else {
          // For text, search across all relevant fields with partial matching
          query = query.or(`deceased_name.ilike.%${searchValue}%,pt_cause_no.ilike.%${searchValue}%,folio_no.ilike.%${searchValue}%,county.ilike.%${searchValue}%,station.ilike.%${searchValue}%,assets.ilike.%${searchValue}%,beneficiaries.ilike.%${searchValue}%`);
        }
      }
      
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }
      
      if (countyFilter !== 'all') {
        query = query.eq('county', countyFilter);
      }
      
      if (yearFilter !== 'all') {
        query = query.eq('file_year', parseInt(yearFilter));
      }
      
      if (sourceFilter !== 'all') {
        query = query.eq('data_source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        // Headers
        'PT Cause No,Folio No,Deceased Name,Gender,Marital Status,Date of Death,Religion,County,Station,Assets,Beneficiaries,File Year,Data Source',
        // Data rows
        ...(data || []).map(trustee => [
          `"${trustee.pt_cause_no || ''}"`,
          `"${trustee.folio_no || ''}"`,
          `"${trustee.deceased_name || ''}"`,
          `"${trustee.gender || ''}"`,
          `"${trustee.marital_status || ''}"`,
          `"${trustee.date_of_death || ''}"`,
          `"${trustee.religion || ''}"`,
          `"${trustee.county || ''}"`,
          `"${trustee.station || ''}"`,
          `"${trustee.assets || ''}"`,
          `"${trustee.beneficiaries || ''}"`,
          trustee.file_year || '',
          `"${trustee.data_source || ''}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `public_trustees_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data?.length || 0} trustee records to CSV file.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export trustees to CSV",
        variant: "destructive",
      });
    }
  };

  const getGenderColor = (gender: string | null) => {
    if (!gender) return 'bg-gray-100 text-gray-800';
    
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male') return 'bg-blue-100 text-blue-800';
    if (lowerGender === 'female') return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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

  if (!user || !user.is_approved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Public Trustees Management</h1>
                  <p className="text-gray-600">Manage public trustees records and deceased estate data</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import CSV</span>
                </Button>
                
                <Button onClick={exportTrustees} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              </div>
            </div>

          </motion.div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search trustees, PT numbers, counties, assets..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {dataSources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                    setGenderFilter('all');
                    setCountyFilter('all');
                    setYearFilter('all');
                    setSourceFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trustees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Public Trustees ({totalTrustees} displayed)</CardTitle>
              <CardDescription>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalTrustees)} of {totalTrustees} quality trustee records
                {hiddenRecordsCount > 0 && (
                  <span className="text-muted-foreground ml-2">
                    • {hiddenRecordsCount} records hidden (no name or quality score &lt; 60%)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PT Cause No</TableHead>
                      <TableHead>Folio No</TableHead>
                      <TableHead>Deceased Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Date of Death</TableHead>
                      <TableHead>Data Quality</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTrustees ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : trustees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Scale className="w-12 h-12 text-gray-400" />
                            <p className="text-gray-500">No trustee records found matching your criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      trustees.map((trustee) => (
                        <TableRow key={trustee.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs">
                            {trustee.pt_cause_no || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {trustee.folio_no || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={trustee.deceased_name || ''}>
                              {trustee.deceased_name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGenderColor(trustee.gender)}>
                              {trustee.gender || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {trustee.county || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(trustee.date_of_death)}
                          </TableCell>
                          <TableCell>
                            <span className={getQualityColor(trustee.data_quality_score || 0)}>
                              {trustee.data_quality_score || 0}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedTrustee(trustee)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                      <Scale className="w-5 h-5" />
                                      <span>Trustee Details</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Complete information for {selectedTrustee?.deceased_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedTrustee && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <span className="text-sm text-gray-500">PT Cause No:</span>
                                          <div className="font-mono">{selectedTrustee.pt_cause_no || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Folio No:</span>
                                          <div className="font-mono">{selectedTrustee.folio_no || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Deceased Name:</span>
                                          <div className="font-medium">{selectedTrustee.deceased_name || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Gender:</span>
                                          <div>
                                            <Badge className={getGenderColor(selectedTrustee.gender)}>
                                              {selectedTrustee.gender || 'Unknown'}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Marital Status:</span>
                                          <div>{selectedTrustee.marital_status || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Date of Death:</span>
                                          <div>{formatDate(selectedTrustee.date_of_death)}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Religion:</span>
                                          <div>{selectedTrustee.religion || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">County:</span>
                                          <div>{selectedTrustee.county || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Station:</span>
                                          <div>{selectedTrustee.station || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Telephone:</span>
                                          <div className="font-mono">{selectedTrustee.telephone_no || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">File Year:</span>
                                          <div>{selectedTrustee.file_year || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Data Quality:</span>
                                          <div className={getQualityColor(selectedTrustee.data_quality_score || 0)}>
                                            {selectedTrustee.data_quality_score || 0}%
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {selectedTrustee.assets && (
                                        <div>
                                          <span className="text-sm text-gray-500">Assets:</span>
                                          <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                                            {selectedTrustee.assets}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {selectedTrustee.beneficiaries && (
                                        <div>
                                          <span className="text-sm text-gray-500">Beneficiaries:</span>
                                          <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                                            {selectedTrustee.beneficiaries}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div>
                                          <span className="text-sm text-gray-500">Date of Advertisement:</span>
                                          <div>{formatDate(selectedTrustee.date_of_advertisement)}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Date of Confirmation:</span>
                                          <div>{formatDate(selectedTrustee.date_of_confirmation)}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Date Account Drawn:</span>
                                          <div>{formatDate(selectedTrustee.date_account_drawn)}</div>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-500">Date Payment Made:</span>
                                          <div>{formatDate(selectedTrustee.date_payment_made)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
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
            </CardContent>
          </Card>
        </div>
      </main>

      {/* CSV Import Dialog */}
      <PublicTrusteesCSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={handleImportComplete}
        userId={user?.id || ''}
      />
    </div>
  );
}