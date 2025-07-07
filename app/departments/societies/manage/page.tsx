'use client';

import { useEffect, useState } from 'react';
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
  Building2,
  Users,
  Calendar,
  MapPin,
  FileText,
  AlertCircle
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
import { SocietiesCSVImportDialog } from '@/components/societies/csv-import-dialog';

interface Society {
  id: string;
  registration_number: string;
  society_name: string;
  registration_date: string;
  file_number: string;
  registry_office: string;
  address: string;
  nature_of_society: string;
  member_class: string;
  member_count: number;
  chairman_name: string;
  secretary_name: string;
  treasurer_name: string;
  exemption_number: string;
  exemption_date: string;
  application_number: string;
  service_type: string;
  submitted_by: string;
  registration_status: string;
  comments: string;
  data_source: string;
  data_quality_score: number;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 20;

export default function SocietiesManagePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [societies, setSocieties] = useState<Society[]>([]);
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSocieties, setTotalSocieties] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  // Filter options
  const [societyTypes, setSocietyTypes] = useState<string[]>([]);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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
      loadSocieties();
      loadFilterOptions();
    }
  }, [user, searchTerm, statusFilter, typeFilter, sourceFilter, currentPage]);

  const loadSocieties = async () => {
    try {
      setIsLoadingSocieties(true);
      
      let query = supabase
        .from('societies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`society_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,chairman_name.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('registration_status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('nature_of_society', typeFilter);
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

      setSocieties(data || []);
      setTotalSocieties(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading societies:', error);
      toast({
        title: "Error Loading Societies",
        description: "Could not load societies data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSocieties(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load unique society types
      const { data: types } = await supabase
        .from('societies')
        .select('nature_of_society')
        .not('nature_of_society', 'is', null);
      
      const uniqueTypes = Array.from(new Set(types?.map(t => t.nature_of_society) || [])).sort();
      setSocietyTypes(uniqueTypes);

      // Load unique data sources
      const { data: sources } = await supabase
        .from('societies')
        .select('data_source')
        .not('data_source', 'is', null);
      
      const uniqueSources = Array.from(new Set(sources?.map(s => s.data_source) || [])).sort();
      setDataSources(uniqueSources);

      // Load unique statuses
      const { data: statuses } = await supabase
        .from('societies')
        .select('registration_status')
        .not('registration_status', 'is', null);
      
      const uniqueStatuses = Array.from(new Set(statuses?.map(s => s.registration_status) || [])).sort();
      setStatusOptions(uniqueStatuses);

    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleImportComplete = () => {
    // Reload societies data after successful import
    loadSocieties();
  };

  const exportSocieties = async () => {
    try {
      // Get all societies matching current filters (without pagination)
      let query = supabase
        .from('societies')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`society_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,chairman_name.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('registration_status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('nature_of_society', typeFilter);
      }
      
      if (sourceFilter !== 'all') {
        query = query.eq('data_source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        // Headers
        'Registration Number,Society Name,Registration Date,Nature,Member Count,Chairman,Secretary,Status,Data Source',
        // Data rows
        ...(data || []).map(society => [
          `"${society.registration_number || ''}"`,
          `"${society.society_name || ''}"`,
          `"${society.registration_date || ''}"`,
          `"${society.nature_of_society || ''}"`,
          society.member_count || 0,
          `"${society.chairman_name || ''}"`,
          `"${society.secretary_name || ''}"`,
          `"${society.registration_status || ''}"`,
          `"${society.data_source || ''}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `societies_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data?.length || 0} societies to CSV file.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export societies to CSV",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status || typeof status !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('registered') || lowerStatus.includes('active')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus.includes('exempted') || lowerStatus.includes('exempt')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (lowerStatus.includes('cancelled') || lowerStatus.includes('rejected')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Societies Management</h1>
                  <p className="text-gray-600">Manage society registrations and data</p>
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
                
                <Button onClick={exportSocieties} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Society
                </Button>
              </div>
            </div>

          </motion.div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search societies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {societyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
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
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSourceFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Societies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Societies ({totalSocieties} total)</CardTitle>
              <CardDescription>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalSocieties)} of {totalSocieties} societies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration No.</TableHead>
                      <TableHead>Society Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Quality</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSocieties ? (
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
                    ) : societies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Building2 className="w-12 h-12 text-gray-400" />
                            <p className="text-gray-500">No societies found matching your criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      societies.map((society) => (
                        <TableRow key={society.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs">
                            {society.registration_number || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={society.society_name || ''}>
                              {society.society_name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {society.nature_of_society || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {society.member_count || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(society.registration_status)}>
                              {society.registration_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={getQualityColor(society.data_quality_score || 0)}>
                              {society.data_quality_score || 0}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {society.data_source?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
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
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Society Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information for {selectedSociety?.society_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedSociety && (
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                      <div>
                                        <span className="text-sm text-gray-500">Registration Number:</span>
                                        <div>{selectedSociety.registration_number || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Society Name:</span>
                                        <div>{selectedSociety.society_name || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Registration Date:</span>
                                        <div>
                                          {selectedSociety.registration_date ? 
                                            new Date(selectedSociety.registration_date).toLocaleDateString() : '-'}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">File Number:</span>
                                        <div>{selectedSociety.file_number || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Registry Office:</span>
                                        <div>{selectedSociety.registry_office || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Nature of Society:</span>
                                        <div>{selectedSociety.nature_of_society || '-'}</div>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-sm text-gray-500">Address:</span>
                                        <div className="mt-1 p-3 bg-gray-50 rounded">{selectedSociety.address || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Chairman:</span>
                                        <div>{selectedSociety.chairman_name || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Secretary:</span>
                                        <div>{selectedSociety.secretary_name || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Treasurer:</span>
                                        <div>{selectedSociety.treasurer_name || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Member Count:</span>
                                        <div>{selectedSociety.member_count || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Status:</span>
                                        <div>
                                          <Badge className={getStatusColor(selectedSociety.registration_status)}>
                                            {selectedSociety.registration_status || 'Unknown'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Data Quality:</span>
                                        <div className={getQualityColor(selectedSociety.data_quality_score || 0)}>
                                          {selectedSociety.data_quality_score || 0}%
                                        </div>
                                      </div>
                                      {selectedSociety.comments && (
                                        <div className="col-span-2">
                                          <span className="text-sm text-gray-500">Comments:</span>
                                          <div className="mt-1 p-3 bg-gray-50 rounded">{selectedSociety.comments}</div>
                                        </div>
                                      )}
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
      <SocietiesCSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={handleImportComplete}
        userId={user?.id || ''}
      />
    </div>
  );
}