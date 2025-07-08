'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
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
  Globe
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

interface Society {
  id: string;
  registration_number: string | null;
  society_name: string | null;
  registration_date: string | null;
  registry_office: string | null;
  address: string | null;
  nature_of_society: string | null;
  member_class: string | null;
  member_count: number | null;
  chairman_name: string | null;
  secretary_name: string | null;
  treasurer_name: string | null;
  registration_status: string | null;
  data_source: string | null;
  created_at: string;
}

export default function SocietiesRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [showSocietyDetails, setShowSocietyDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedNatures, setSelectedNatures] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  
  // Statistics
  const [stats, setStats] = useState({
    totalSocieties: 0,
    activeSocieties: 0,
    totalMembers: 0,
    thisYear: 0,
    avgMemberCount: 0,
    topRegistry: 'N/A'
  });

  useEffect(() => {
    loadSocieties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [societies, searchQuery, selectedStatuses, selectedNatures, selectedOffices, selectedDataSources, selectedYears]);

  const loadSocieties = async () => {
    try {
      setIsLoading(true);
      
      // Load societies without RLS restrictions for public view
      const { data, error } = await supabase
        .from('societies')
        .select(`
          id,
          registration_number,
          society_name,
          registration_date,
          registry_office,
          address,
          nature_of_society,
          member_class,
          member_count,
          chairman_name,
          secretary_name,
          treasurer_name,
          registration_status,
          data_source,
          created_at
        `)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      const societiesData = data || [];
      setSocieties(societiesData);
      
      // Calculate statistics
      const totalSocieties = societiesData.length;
      const activeSocieties = societiesData.filter(s => 
        s.registration_status && 
        s.registration_status.toLowerCase().includes('active')
      ).length;
      
      const totalMembers = societiesData.reduce((sum, society) => {
        return sum + (society.member_count || 0);
      }, 0);
      
      const currentYear = new Date().getFullYear();
      const thisYear = societiesData.filter(s => 
        s.registration_date && 
        new Date(s.registration_date).getFullYear() === currentYear
      ).length;
      
      const avgMemberCount = societiesData.length > 0 
        ? Math.round(totalMembers / societiesData.length) 
        : 0;
      
      // Get top registry office
      const registryCount = societiesData.reduce((acc, society) => {
        if (society.registry_office) {
          acc[society.registry_office] = (acc[society.registry_office] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const topRegistry = Object.entries(registryCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
      
      setStats({
        totalSocieties,
        activeSocieties,
        totalMembers,
        thisYear,
        avgMemberCount,
        topRegistry
      });
      
    } catch (error) {
      console.error('Error loading societies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...societies];
    
    // Text search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(society =>
        society.society_name?.toLowerCase().includes(query) ||
        society.registration_number?.toLowerCase().includes(query) ||
        society.nature_of_society?.toLowerCase().includes(query) ||
        society.registry_office?.toLowerCase().includes(query) ||
        society.address?.toLowerCase().includes(query) ||
        society.chairman_name?.toLowerCase().includes(query) ||
        society.secretary_name?.toLowerCase().includes(query)
      );
    }
    
    // Filter by registration status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(society => 
        society.registration_status && 
        selectedStatuses.some(status => 
          society.registration_status!.toLowerCase().includes(status.toLowerCase())
        )
      );
    }
    
    // Filter by nature of society
    if (selectedNatures.length > 0) {
      filtered = filtered.filter(society => 
        society.nature_of_society && 
        selectedNatures.includes(society.nature_of_society)
      );
    }
    
    // Filter by registry office
    if (selectedOffices.length > 0) {
      filtered = filtered.filter(society => 
        society.registry_office && 
        selectedOffices.includes(society.registry_office)
      );
    }
    
    // Filter by data source
    if (selectedDataSources.length > 0) {
      filtered = filtered.filter(society => 
        society.data_source && 
        selectedDataSources.includes(society.data_source)
      );
    }
    
    // Filter by registration year
    if (selectedYears.length > 0) {
      filtered = filtered.filter(society => 
        society.registration_date && 
        selectedYears.includes(new Date(society.registration_date).getFullYear().toString())
      );
    }
    
    setFilteredSocieties(filtered);
  };

  const getUniqueValues = (field: keyof Society) => {
    return Array.from(new Set(
      societies
        .map(society => society[field])
        .filter(value => value && value.toString().trim() !== '')
    )).sort();
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active') || lowerStatus.includes('approved')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('under review')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus.includes('suspended') || lowerStatus.includes('inactive')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const exportToCSV = () => {
    const headers = [
      'Registration Number',
      'Society Name', 
      'Registration Date',
      'Registry Office',
      'Nature of Society',
      'Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredSocieties.map(society => [
        society.registration_number || '',
        society.society_name || '',
        society.registration_date || '',
        society.registry_office || '',
        society.nature_of_society || '',
        society.registration_status || ''
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

  const getNatureDistribution = () => {
    const natureCounts = societies.reduce((acc, society) => {
      if (society.nature_of_society) {
        acc[society.nature_of_society] = (acc[society.nature_of_society] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(natureCounts));
    
    return Object.entries(natureCounts)
      .map(([nature, count]) => ({
        nature,
        count,
        total: maxCount
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getOfficeDistribution = () => {
    const officeCounts = societies.reduce((acc, society) => {
      if (society.registry_office) {
        acc[society.registry_office] = (acc[society.registry_office] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(officeCounts));
    
    return Object.entries(officeCounts)
      .map(([office, count]) => ({
        office,
        count,
        total: maxCount
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const SocietyCard = ({ society }: { society: Society }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {society.society_name || 'Unnamed Society'}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(society.registration_status)}>
                  {society.registration_status || 'Unknown Status'}
                </Badge>
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
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span className="font-medium">Reg No:</span>
                <span className="ml-1">{society.registration_number || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">Registered:</span>
                <span className="ml-1">{formatDate(society.registration_date)}</span>
              </div>
              
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                <span className="font-medium">Office:</span>
                <span className="ml-1">{society.registry_office || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm">
              <span className="font-medium text-gray-700 block mb-1">Nature of Society:</span>
              <span className="text-gray-600">
                {society.nature_of_society || 'Not specified'}
              </span>
            </div>
            
            {society.member_count && (
              <div className="text-sm mt-3">
                <span className="font-medium text-gray-700 block mb-1">Members:</span>
                <div className="flex items-center text-gray-600">
                  <Users className="w-3 h-3 mr-1" />
                  {society.member_count.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          
          <div>
            {society.address && (
              <div className="text-sm">
                <span className="font-medium text-gray-700 block mb-1">Address:</span>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="text-xs leading-relaxed">
                    {society.address.length > 50 
                      ? `${society.address.substring(0, 50)}...` 
                      : society.address
                    }
                  </span>
                </div>
              </div>
            )}
            
            {society.chairman_name && (
              <div className="text-sm mt-3">
                <span className="font-medium text-gray-700 block mb-1">Chairman:</span>
                <div className="flex items-center text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  {society.chairman_name}
                </div>
              </div>
            )}
          </div>
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
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg mr-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Societies Registry</h1>
                <p className="text-green-100">Registered societies, organizations and community groups</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalSocieties}</div>
                <div className="text-green-200 text-sm">Total Societies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeSocieties}</div>
                <div className="text-green-200 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.thisYear}</div>
                <div className="text-green-200 text-sm">This Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {formatLargeNumber(stats.totalMembers)}
                </div>
                <div className="text-green-200 text-sm">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.avgMemberCount}</div>
                <div className="text-green-200 text-sm">Avg Members</div>
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
                      placeholder="Search societies by name, registration number, nature, office, or chairman..."
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
                    
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredSocieties.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters Panel */}
            {isFiltersOpen && (
              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {/* Status Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Status</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('registration_status').map((status) => (
                                  <div key={status} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`status-${status}`}
                                      checked={selectedStatuses.includes(status as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedStatuses([...selectedStatuses, status as string]);
                                        } else {
                                          setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`status-${status}`} className="text-sm">{status}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Nature Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Nature</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('nature_of_society').map((nature) => (
                                  <div key={nature} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`nature-${nature}`}
                                      checked={selectedNatures.includes(nature as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedNatures([...selectedNatures, nature as string]);
                                        } else {
                                          setSelectedNatures(selectedNatures.filter(n => n !== nature));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`nature-${nature}`} className="text-sm">{nature}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Registry Office Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Registry Office</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('registry_office').map((office) => (
                                  <div key={office} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`office-${office}`}
                                      checked={selectedOffices.includes(office as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedOffices([...selectedOffices, office as string]);
                                        } else {
                                          setSelectedOffices(selectedOffices.filter(o => o !== office));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`office-${office}`} className="text-sm">{office}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Data Source Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Data Source</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {getUniqueValues('data_source').map((source) => (
                                  <div key={source} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`source-${source}`}
                                      checked={selectedDataSources.includes(source as string)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedDataSources([...selectedDataSources, source as string]);
                                        } else {
                                          setSelectedDataSources(selectedDataSources.filter(s => s !== source));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`source-${source}`} className="text-sm">{source}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Years Filter */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Year</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {Array.from(new Set(
                                  societies
                                    .filter(s => s.registration_date)
                                    .map(s => new Date(s.registration_date!).getFullYear())
                                    .sort((a, b) => b - a)
                                )).map((year) => (
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
                                setSelectedStatuses([]);
                                setSelectedNatures([]);
                                setSelectedOffices([]);
                                setSelectedDataSources([]);
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
                Society Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Real-time insights and trends from the societies registry database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Registration Rate */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">Active Rate</h4>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {stats.totalSocieties > 0 ? Math.round((stats.activeSocieties / stats.totalSocieties) * 100) : 0}%
                    </div>
                    <p className="text-sm text-green-600">
                      {stats.activeSocieties} of {stats.totalSocieties} societies active
                    </p>
                  </CardContent>
                </Card>

                {/* Member Coverage */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800">Member Coverage</h4>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatLargeNumber(stats.totalMembers)}
                    </div>
                    <p className="text-sm text-blue-600">
                      Total registered members
                    </p>
                  </CardContent>
                </Card>

                {/* Top Registry */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800">Top Registry</h4>
                      <Building className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-700 truncate">
                      {stats.topRegistry}
                    </div>
                    <p className="text-sm text-purple-600">
                      Most active registry office
                    </p>
                  </CardContent>
                </Card>

                {/* Growth Rate */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-amber-800">This Year</h4>
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700">
                      {stats.thisYear}
                    </div>
                    <p className="text-sm text-amber-600">
                      New registrations in {new Date().getFullYear()}
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
                      Top Nature of Society
                    </h4>
                    <div className="space-y-2">
                      {getNatureDistribution().map((nature, index) => (
                        <div key={nature.nature} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate max-w-xs" title={nature.nature}>
                            {nature.nature.length > 25 ? `${nature.nature.substring(0, 25)}...` : nature.nature}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-green-500 rounded" 
                              style={{ width: `${(nature.count / nature.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{nature.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Top Registry Offices
                    </h4>
                    <div className="space-y-2">
                      {getOfficeDistribution().map((office, index) => (
                        <div key={office.office} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate max-w-xs" title={office.office}>
                            {office.office.length > 25 ? `${office.office.substring(0, 25)}...` : office.office}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="h-2 bg-blue-500 rounded" 
                              style={{ width: `${(office.count / office.total) * 100}px` }}
                            />
                            <span className="text-sm font-medium text-gray-800">{office.count}</span>
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
                    {isLoading ? 'Loading societies...' : `Found ${filteredSocieties.length} societies`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : filteredSocieties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No societies found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedStatuses.length > 0 || selectedNatures.length > 0 || selectedOffices.length > 0
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Society Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedSociety?.society_name || 'this society'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSociety && (
            <div className="space-y-6">
              {/* Society Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Society Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Society Name:</span>
                      <div className="text-sm mt-1">{selectedSociety.society_name || 'N/A'}</div>
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
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedSociety.registration_status)}>
                          {selectedSociety.registration_status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registry Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Registry Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Registry Office:</span>
                      <div className="text-sm mt-1">{selectedSociety.registry_office || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nature of Society:</span>
                      <div className="text-sm mt-1">{selectedSociety.nature_of_society || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Member Class:</span>
                      <div className="text-sm mt-1">{selectedSociety.member_class || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Member Count:</span>
                      <div className="text-sm mt-1">{selectedSociety.member_count?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leadership */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Leadership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Chairman:</span>
                      <div className="text-sm mt-1">{selectedSociety.chairman_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Secretary:</span>
                      <div className="text-sm mt-1">{selectedSociety.secretary_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Treasurer:</span>
                      <div className="text-sm mt-1">{selectedSociety.treasurer_name || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              {selectedSociety.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                      {selectedSociety.address}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSocietyDetails(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    const societyData = [
                      selectedSociety.registration_number || '',
                      selectedSociety.society_name || '',
                      selectedSociety.registration_date || '',
                      selectedSociety.registry_office || '',
                      selectedSociety.nature_of_society || '',
                      selectedSociety.registration_status || ''
                    ].map(field => `"${field}"`).join(',');
                    
                    const csvContent = [
                      'Registration Number,Society Name,Registration Date,Registry Office,Nature of Society,Status',
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
                  Export Society
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}