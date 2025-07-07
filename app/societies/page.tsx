'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Calendar,
  FileText,
  Award,
  Eye,
  ArrowUpDown
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

const ITEMS_PER_PAGE = 15;

export default function SocietiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State management
  const [societies, setSocieties] = useState<Society[]>([]);
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSocieties, setTotalSocieties] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [sortField, setSortField] = useState<string>('society_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter options
  const [societyTypes, setSocietyTypes] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // Summary stats
  const [stats, setStats] = useState({
    totalSocieties: 0,
    activeSocieties: 0,
    exemptedSocieties: 0,
    totalMembers: 0
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_approved) {
      loadSocieties();
      loadFilterOptions();
      loadStats();
    }
  }, [user, searchTerm, statusFilter, typeFilter, currentPage, sortField, sortDirection]);

  const loadSocieties = async () => {
    try {
      setIsLoadingSocieties(true);
      
      let query = supabase
        .from('societies')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' });

      // Apply filters
      if (searchTerm) {
        query = query.or(`society_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,chairman_name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('registration_status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('nature_of_society', typeFilter);
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

  const loadStats = async () => {
    try {
      const { data: societies, error } = await supabase
        .from('societies')
        .select('*');

      if (error) throw error;

      const societiesData = societies || [];
      const totalSocieties = societiesData.length;
      
      // Count active vs exempted societies
      const exemptedSocieties = societiesData.filter(s => 
        s.exemption_number || s.data_source === 'exempted_societies'
      ).length;
      const activeSocieties = totalSocieties - exemptedSocieties;

      // Calculate total members
      const totalMembers = societiesData.reduce((sum, society) => {
        return sum + (society.member_count || 0);
      }, 0);

      setStats({
        totalSocieties,
        activeSocieties,
        exemptedSocieties,
        totalMembers
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

  const formatLargeNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
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
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Public Societies Registry</h1>
                <p className="text-gray-600">Browse registered societies and organizations</p>
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
                <CardTitle className="text-sm font-medium">Active Societies</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSocieties}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatLargeNumber(stats.totalMembers)}</div>
                <p className="text-xs text-muted-foreground">Across all societies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exempted</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.exemptedSocieties}</div>
                <p className="text-xs text-muted-foreground">Special status</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
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
              <CardTitle>Registered Societies ({totalSocieties} total)</CardTitle>
              <CardDescription>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalSocieties)} of {totalSocieties} societies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('registration_number')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Registration No.</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('society_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Society Name</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSocieties ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : societies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
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
                            <div className="truncate font-medium" title={society.society_name || ''}>
                              {society.society_name || '-'}
                            </div>
                            {society.chairman_name && (
                              <div className="text-xs text-gray-500 truncate">
                                Chair: {society.chairman_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {society.nature_of_society || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {society.member_count || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm" title={society.address || ''}>
                              {society.registry_office || society.address || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(society.registration_status)}>
                              {society.registration_status || 'Unknown'}
                            </Badge>
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
                                      <div className="font-mono text-sm">{selectedSociety.registration_number || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Society Name:</span>
                                      <div className="font-medium">{selectedSociety.society_name || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Registration Date:</span>
                                      <div>
                                        {selectedSociety.registration_date ? 
                                          new Date(selectedSociety.registration_date).toLocaleDateString() : '-'}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Registry Office:</span>
                                      <div>{selectedSociety.registry_office || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Nature of Society:</span>
                                      <div>{selectedSociety.nature_of_society || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Member Count:</span>
                                      <div>{selectedSociety.member_count || '-'}</div>
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
                                      <span className="text-sm text-gray-500">Status:</span>
                                      <div>
                                        <Badge className={getStatusColor(selectedSociety.registration_status)}>
                                          {selectedSociety.registration_status || 'Unknown'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Data Source:</span>
                                      <div className="text-xs">
                                        <Badge variant="secondary">
                                          {selectedSociety.data_source?.replace('_', ' ') || 'Unknown'}
                                        </Badge>
                                      </div>
                                    </div>
                                    {selectedSociety.exemption_number && (
                                      <div className="col-span-2">
                                        <span className="text-sm text-gray-500">Exemption Details:</span>
                                        <div className="mt-1 p-3 bg-blue-50 rounded">
                                          <div className="text-sm">
                                            <strong>Number:</strong> {selectedSociety.exemption_number}
                                          </div>
                                          {selectedSociety.exemption_date && (
                                            <div className="text-sm">
                                              <strong>Date:</strong> {new Date(selectedSociety.exemption_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
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
    </div>
  );
}