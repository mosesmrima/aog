'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Edit, Trash2, Eye, Search, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';

interface Marriage {
  id: string;
  marriage_date: string;
  groom_name: string;
  bride_name: string;
  place_of_marriage: string;
  certificate_number: string | null;
  license_type: string | null;
  created_at: string;
  data_quality_score?: number;
  missing_fields?: string[];
  has_duplicates?: boolean;
  import_warnings?: any;
}

interface MarriagesTableProps {
  onEdit: (marriage: Marriage) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

export function MarriagesTable({ onEdit, onAdd, refreshTrigger }: MarriagesTableProps) {
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [filteredMarriages, setFilteredMarriages] = useState<Marriage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const getQualityIndicator = (marriage: Marriage) => {
    const score = marriage.data_quality_score ?? 100;
    const missingFields = marriage.missing_fields ?? [];
    const hasWarnings = marriage.import_warnings && marriage.import_warnings.length > 0;
    
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

  const fetchMarriages = async () => {
    try {
      const { data, error } = await supabase
        .from('marriages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMarriages(data || []);
      setFilteredMarriages(data || []);
    } catch (error) {
      console.error('Error fetching marriages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marriage records.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarriages();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredMarriages(marriages);
      return;
    }

    const filtered = marriages.filter((marriage) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        marriage.groom_name.toLowerCase().includes(searchLower) ||
        marriage.bride_name.toLowerCase().includes(searchLower) ||
        marriage.place_of_marriage.toLowerCase().includes(searchLower) ||
        marriage.certificate_number.toLowerCase().includes(searchLower) ||
        (marriage.license_type && marriage.license_type.toLowerCase().includes(searchLower))
      );
    });

    setFilteredMarriages(filtered);
  }, [searchTerm, marriages]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marriages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Marriage deleted',
        description: 'Marriage record has been successfully deleted.',
      });

      fetchMarriages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete marriage record.',
        variant: 'destructive',
      });
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Marriage Records</CardTitle>
              <CardDescription>
                Manage and view all marriage registrations
              </CardDescription>
            </div>
            <Button onClick={onAdd} className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Marriage
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search marriages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMarriages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No marriages found matching your search.' : 'No marriage records found.'}
              </p>
            </div>
          ) : (
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
                  {filteredMarriages.map((marriage) => {
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}