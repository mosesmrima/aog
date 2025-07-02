'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMarriages, useDeleteMarriage, type Marriage, type MarriageFilters } from '@/hooks/use-marriages';

interface OptimizedMarriagesTableProps {
  onEdit: (marriage: Marriage) => void;
  onAdd: () => void;
}

export function OptimizedMarriagesTable({ onEdit, onAdd }: OptimizedMarriagesTableProps) {
  const [filters, setFilters] = useState<MarriageFilters>({
    searchField: 'all'
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const { data: marriagesData, isLoading } = useMarriages(filters, pagination);
  const deleteMarriage = useDeleteMarriage();

  const getQualityIndicator = (marriage: Marriage) => {
    const score = marriage.data_quality_score ?? 100;
    const missingFields = marriage.missing_fields ?? [];
    
    if (score >= 90 && missingFields.length === 0) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        tooltip: 'High quality record'
      };
    } else if (score >= 70) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        tooltip: `Quality issues: ${missingFields.join(', ') || 'Data concerns'}`
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        tooltip: `Poor quality: Missing ${missingFields.join(', ')}`
      };
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMarriage.mutateAsync(id);
      toast({
        title: 'Marriage deleted',
        description: 'Marriage record has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete marriage record.',
        variant: 'destructive',
      });
    }
  };

  // Debounced search to improve performance
  const debouncedSearch = useMemo(
    () => {
      const timeoutRef = { current: null as NodeJS.Timeout | null };
      
      return (value: string) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setFilters(prev => ({ ...prev, search: value }));
          setPagination(prev => ({ ...prev, page: 1 }));
        }, 300); // 300ms delay
      };
    },
    []
  );

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  const handleFilterChange = (key: keyof MarriageFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const resetFilters = () => {
    setFilters({ searchField: 'all' });
    setPagination({ page: 1, pageSize: 20 });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination({ page: 1, pageSize: parseInt(newPageSize) });
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const marriages = marriagesData?.data || [];
  const totalPages = marriagesData?.totalPages || 1;
  const currentPage = marriagesData?.currentPage || 1;
  const totalCount = marriagesData?.count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Marriage Records</CardTitle>
              <CardDescription>
                {totalCount} total records • Page {currentPage} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button onClick={onAdd} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Marriage
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Enhanced Search */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    filters.searchField === 'certificate_number' ? "Type progressively: 4 → 48 → 488 → 48849..." :
                    filters.searchField === 'groom_name' ? "e.g., John Smith (full) or John (partial)..." :
                    filters.searchField === 'bride_name' ? "e.g., Mary Johnson (full) or Mary (partial)..." :
                    filters.searchField === 'place_of_marriage' ? "e.g., REGISTRAR'S OFFICE NAIROBI..." :
                    "Search all fields - progressive matching for numbers and names..."
                  }
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="absolute right-3 top-3 h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm">
                      <div className="space-y-2 text-sm">
                        <p><strong>Smart Search Features:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><strong>Certificate Numbers:</strong> Progressive matching - type 4 → 48 → 488 → 48849</li>
                          <li><strong>Names:</strong> Multiple words (John Smith) searches for both words in the field</li>
                          <li><strong>All Fields:</strong> Numbers prioritize certificate search, text searches all fields</li>
                          <li><strong>Real-time:</strong> Searches entire database (144K+ records), not just visible results</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={filters.searchField}
                onValueChange={(value) => handleFilterChange('searchField', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="groom_name">Groom Name</SelectItem>
                  <SelectItem value="bride_name">Bride Name</SelectItem>
                  <SelectItem value="certificate_number">Certificate #</SelectItem>
                  <SelectItem value="place_of_marriage">Place</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Quality Score</label>
                  <Select
                    value={filters.qualityScore?.toString()}
                    onValueChange={(value) => handleFilterChange('qualityScore', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Quality</SelectItem>
                      <SelectItem value="90">High (90+)</SelectItem>
                      <SelectItem value="70">Medium (70+)</SelectItem>
                      <SelectItem value="0">Low (All)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {marriages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {filters.search || filters.dateFrom || filters.dateTo || filters.qualityScore ? 
                  'No marriages found matching your filters.' : 
                  'No marriage records found.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quality</TableHead>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Groom</TableHead>
                      <TableHead>Bride</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Place</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marriages.map((marriage: Marriage) => {
                      const qualityIndicator = getQualityIndicator(marriage);
                      const QualityIcon = qualityIndicator.icon;
                      
                      return (
                        <TableRow key={marriage.id}>
                          <TableCell>
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${qualityIndicator.bgColor}`} title={qualityIndicator.tooltip}>
                              <QualityIcon className={`w-4 h-4 ${qualityIndicator.color}`} />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {marriage.certificate_number ? (
                              marriage.certificate_number
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="text-muted-foreground italic">Missing</span>
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{marriage.groom_name}</TableCell>
                          <TableCell>{marriage.bride_name}</TableCell>
                          <TableCell>
                            {format(new Date(marriage.marriage_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{marriage.place_of_marriage}</TableCell>
                          <TableCell>
                            {marriage.license_type ? (
                              <Badge variant="secondary">{marriage.license_type}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(marriage)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Marriage Record</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this marriage record? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(marriage.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pagination.pageSize + 1} to {Math.min(currentPage * pagination.pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={pagination.pageSize.toString()}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}