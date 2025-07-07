'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Loader2, 
  Edit, 
  Trash2,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Scale
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CSVImportDialog } from '@/components/legal-affairs/csv-import-dialog';

interface LegalCase {
  id: string;
  ag_file_reference: string;
  court_station: string;
  case_parties: string;
  nature_of_claim: string;
  potential_liability: number;
  current_case_status: string;
  remarks: string;
  case_number: string;
  case_year: number;
  court_rank: string;
  ministry: string;
  counsel_dealing: string;
  region: string;
  data_quality_score: number;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 50;

export default function LegalAffairsManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  
  // Dialog states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  
  // Filter options
  const [courtStations, setCourtStations] = useState<string[]>([]);
  const [caseStatuses, setCaseStatuses] = useState<string[]>([]);
  const [caseYears, setCaseYears] = useState<number[]>([]);

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else if (!user.is_approved) {
        router.push('/pending');
      }
    }
  }, [user, authLoading, router]);

  // Load initial data
  useEffect(() => {
    if (user?.is_approved) {
      loadCases();
      loadFilterOptions();
    }
  }, [user, currentPage, searchTerm, statusFilter, courtFilter, yearFilter]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('legal_affairs_cases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`ag_file_reference.ilike.%${searchTerm}%,case_parties.ilike.%${searchTerm}%,nature_of_claim.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('current_case_status', statusFilter);
      }
      
      if (courtFilter !== 'all') {
        query = query.eq('court_station', courtFilter);
      }
      
      if (yearFilter !== 'all') {
        query = query.eq('case_year', parseInt(yearFilter));
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCases(data || []);
      setTotalCases(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

    } catch (error) {
      console.error('Error loading cases:', error);
      toast({
        title: "Error",
        description: "Failed to load legal cases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load unique court stations
      const { data: courts } = await supabase
        .from('legal_affairs_cases')
        .select('court_station')
        .not('court_station', 'is', null);
      
      const uniqueCourts = [...new Set(courts?.map(c => c.court_station) || [])].sort();
      setCourtStations(uniqueCourts);

      // Load unique case statuses
      const { data: statuses } = await supabase
        .from('legal_affairs_cases')
        .select('current_case_status')
        .not('current_case_status', 'is', null);
      
      const uniqueStatuses = [...new Set(statuses?.map(s => s.current_case_status) || [])].sort();
      setCaseStatuses(uniqueStatuses);

      // Load unique years
      const { data: years } = await supabase
        .from('legal_affairs_cases')
        .select('case_year')
        .not('case_year', 'is', null);
      
      const uniqueYears = [...new Set(years?.map(y => y.case_year) || [])].sort((a, b) => b - a);
      setCaseYears(uniqueYears);

    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (type: string, value: string) => {
    setCurrentPage(1); // Reset to first page when filtering
    
    switch (type) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'court':
        setCourtFilter(value);
        break;
      case 'year':
        setYearFilter(value);
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCourtFilter('all');
    setYearFilter('all');
    setCurrentPage(1);
  };

  const exportToCSV = async () => {
    try {
      toast({
        title: "Exporting...",
        description: "Preparing your CSV file",
      });

      // Get all cases matching current filters (without pagination)
      let query = supabase
        .from('legal_affairs_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`ag_file_reference.ilike.%${searchTerm}%,case_parties.ilike.%${searchTerm}%,nature_of_claim.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('current_case_status', statusFilter);
      }
      
      if (courtFilter !== 'all') {
        query = query.eq('court_station', courtFilter);
      }
      
      if (yearFilter !== 'all') {
        query = query.eq('case_year', parseInt(yearFilter));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Convert to CSV
      const headers = [
        'AG File Reference',
        'Court Station', 
        'Case Parties',
        'Nature of Claim',
        'Potential Liability (KSH)',
        'Current Case Status',
        'Remarks',
        'Case Number',
        'Case Year',
        'Court Rank',
        'Quality Score',
        'Created Date'
      ];

      const csvContent = [
        headers.join(','),
        ...(data || []).map(case_ => [
          `"${case_.ag_file_reference || ''}"`,
          `"${case_.court_station || ''}"`,
          `"${case_.case_parties || ''}"`,
          `"${case_.nature_of_claim || ''}"`,
          case_.potential_liability || 0,
          `"${case_.current_case_status || ''}"`,
          `"${case_.remarks || ''}"`,
          `"${case_.case_number || ''}"`,
          case_.case_year || '',
          `"${case_.court_rank || ''}"`,
          case_.data_quality_score || 0,
          new Date(case_.created_at).toLocaleDateString()
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal_affairs_cases_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data?.length || 0} cases to CSV`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export cases to CSV",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('concluded') || lowerStatus.includes('judgment delivered')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('hearing')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus.includes('closed') || lowerStatus.includes('dismissed')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'KSH 0';
    return `KSH ${amount.toLocaleString()}`;
  };

  if (authLoading || !user || !user.is_approved) {
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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Legal Affairs Management</h1>
                  <p className="text-gray-600">
                    Manage legal cases and proceedings ({totalCases.toLocaleString()} total cases)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={isLoading || cases.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import CSV</span>
                </Button>
                
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Case</span>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search & Filter Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by AG reference, parties, or claim type..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Case Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {caseStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={courtFilter} onValueChange={(value) => handleFilterChange('court', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Court Station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courts</SelectItem>
                      {courtStations.map((court) => (
                        <SelectItem key={court} value={court}>
                          {court}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={yearFilter} onValueChange={(value) => handleFilterChange('year', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Case Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {caseYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(searchTerm || statusFilter !== 'all' || courtFilter !== 'all' || yearFilter !== 'all') && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Showing {cases.length} of {totalCases} cases
                    </span>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Cases Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Legal Cases</CardTitle>
                <CardDescription>
                  Complete list of legal affairs cases with filtering and search capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : cases.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || courtFilter !== 'all' || yearFilter !== 'all'
                        ? 'No cases match your search criteria'
                        : 'Get started by importing CSV files or adding cases manually'
                      }
                    </p>
                    <Button onClick={() => setShowImportDialog(true)}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Import Cases
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">AG Reference</TableHead>
                            <TableHead>Court Station</TableHead>
                            <TableHead className="w-64">Case Parties</TableHead>
                            <TableHead>Nature of Claim</TableHead>
                            <TableHead className="w-32">Liability</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-20">Quality</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cases.map((case_) => (
                            <TableRow key={case_.id} className="hover:bg-gray-50">
                              <TableCell className="font-mono text-xs">
                                {case_.ag_file_reference}
                              </TableCell>
                              <TableCell>{case_.court_station}</TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={case_.case_parties}>
                                  {case_.case_parties}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={case_.nature_of_claim}>
                                  {case_.nature_of_claim || '-'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(case_.potential_liability)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(case_.current_case_status)}>
                                  {case_.current_case_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={getQualityColor(case_.data_quality_score)}>
                                  {case_.data_quality_score}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCases)} of {totalCases} cases
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        </div>
      </main>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={() => {
          loadCases();
          loadFilterOptions();
        }}
        userId={user.id}
      />

      {/* Case Details Dialog */}
      <Dialog open={showCaseDetails} onOpenChange={setShowCaseDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
            <DialogDescription>
              Complete information for case {selectedCase?.ag_file_reference}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Case Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">AG File Reference:</span>
                      <div className="font-mono">{selectedCase.ag_file_reference}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Case Number:</span>
                      <div>{selectedCase.case_number || '-'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Case Year:</span>
                      <div>{selectedCase.case_year || '-'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Data Quality Score:</span>
                      <div>
                        <span className={getQualityColor(selectedCase.data_quality_score)}>
                          {selectedCase.data_quality_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Court Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Court Station:</span>
                      <div>{selectedCase.court_station}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Court Rank:</span>
                      <div>{selectedCase.court_rank || '-'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Region:</span>
                      <div>{selectedCase.region || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Case Details</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Case Parties:</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded">{selectedCase.case_parties}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Nature of Claim:</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded">{selectedCase.nature_of_claim || '-'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Current Status:</span>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedCase.current_case_status)}>
                        {selectedCase.current_case_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Potential Liability:</span>
                    <div className="text-lg font-medium">{formatCurrency(selectedCase.potential_liability)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Remarks:</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded">{selectedCase.remarks || '-'}</div>
                  </div>
                </div>
              </div>

              {(selectedCase.ministry || selectedCase.counsel_dealing) && (
                <div>
                  <h3 className="font-medium mb-3">Administrative Information</h3>
                  <div className="space-y-2">
                    {selectedCase.ministry && (
                      <div>
                        <span className="text-sm text-gray-500">Ministry:</span>
                        <div>{selectedCase.ministry}</div>
                      </div>
                    )}
                    {selectedCase.counsel_dealing && (
                      <div>
                        <span className="text-sm text-gray-500">Counsel Dealing:</span>
                        <div>{selectedCase.counsel_dealing}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}