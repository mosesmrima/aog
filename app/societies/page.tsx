'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  Calendar,
  FileText,
  Eye,
  ArrowUpDown,
  Upload,
  Download,
  Filter,
  X
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
import { supabase } from '@/lib/supabase';
import { SocietiesCSVImportDialog } from '@/components/societies/csv-import-dialog';

interface Society {
  id: string;
  registered_name: string | null;
  registration_date: string | null;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 15;

export default function SocietiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State management
  const [societies, setSocieties] = useState<Society[]>([]);
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSocieties, setTotalSocieties] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Summary stats
  const [stats, setStats] = useState({
    totalSocieties: 0,
    thisYear: 0,
    lastYear: 0,
    recent: 0
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_approved) {
      loadSocieties();
      loadStats();
    }
  }, [user, searchTerm, selectedYear, currentPage, sortField, sortDirection]);

  const loadSocieties = async () => {
    try {
      setIsLoadingSocieties(true);
      
      // First, get the total count of all societies (no filters)
      const { count: totalCount } = await supabase
        .from('societies')
        .select('*', { count: 'exact', head: true });
      
      // Then get filtered and paginated results
      let query = supabase
        .from('societies')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`registered_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`);
      }
      
      // Apply year filter
      if (selectedYear !== 'all') {
        const startOfYear = `${selectedYear}-01-01`;
        const endOfYear = `${selectedYear}-12-31`;
        query = query.gte('registration_date', startOfYear).lte('registration_date', endOfYear);
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count: filteredCount } = await query;

      if (error) throw error;

      setSocieties(data || []);
      setTotalSocieties(totalCount || 0);
      setFilteredCount(filteredCount || 0);
      setTotalPages(Math.ceil((filteredCount || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading societies:', error);
    } finally {
      setIsLoadingSocieties(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: societies, error } = await supabase
        .from('societies')
        .select('*');

      if (error) throw error;

      const societiesData = societies || [];
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
      console.error('Error loading stats:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Registered Name', 'Registration Date', 'Registration Number'];
    
    const csvContent = [
      headers.join(','),
      ...societies.map(society => [
        society.registered_name || '',
        society.registration_date || '',
        society.registration_number || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `societies-admin-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedYear('all');
    setCurrentPage(1);
  };

  const handleImportComplete = () => {
    setShowImportDialog(false);
    loadSocieties();
    loadStats();
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
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Societies Management</h1>
                  <p className="text-gray-600">Manage registered societies and organizations</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button onClick={exportToCSV} variant="outline" disabled={societies.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setShowImportDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Societies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSocieties}</div>
                <p className="text-xs text-muted-foreground">Registered organizations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisYear}</div>
                <p className="text-xs text-muted-foreground">Registered in {new Date().getFullYear()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Year</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lastYear}</div>
                <p className="text-xs text-muted-foreground">Registered in {new Date().getFullYear() - 1}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recent}</div>
                <p className="text-xs text-muted-foreground">Added in last 30 days</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or registration number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
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
                
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={!searchTerm && selectedYear === 'all'}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Societies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Societies Registry ({totalSocieties.toLocaleString()} total)</CardTitle>
              <CardDescription>
                {searchTerm || selectedYear !== 'all' ? (
                  `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredCount)} of ${filteredCount.toLocaleString()} filtered results (${totalSocieties.toLocaleString()} total societies)`
                ) : (
                  `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalSocieties)} of ${totalSocieties.toLocaleString()} societies`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('registered_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Society Name</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('registration_number')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Registration Number</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('registration_date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Registration Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Added</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSocieties ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : societies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Building2 className="w-12 h-12 text-gray-400" />
                            <p className="text-gray-500">No societies found matching your criteria</p>
                            <Button 
                              onClick={() => setShowImportDialog(true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import CSV Data
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      societies.map((society) => (
                        <TableRow key={society.id} className="hover:bg-gray-50">
                          <TableCell className="max-w-xs">
                            <div className="font-medium truncate" title={society.registered_name || ''}>
                              {society.registered_name || 'Unnamed Society'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {society.registration_number || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(society.registration_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {formatDate(society.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedSociety(society)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Society Details</DialogTitle>
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
                                            <span className="text-sm font-medium text-gray-600">Added to System:</span>
                                            <div className="text-sm mt-1">{formatDate(selectedSociety.created_at)}</div>
                                          </div>
                                          <div>
                                            <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                                            <div className="text-sm mt-1">{formatDate(selectedSociety.updated_at)}</div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
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
      <SocietiesCSVImportDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}