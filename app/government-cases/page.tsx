'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Plus, CheckCircle, AlertCircle, Loader2, Scale } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { GovernmentCaseForm } from '@/components/government-cases/government-case-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { GovernmentCaseBulkImporter, type GovernmentCaseImportResult } from '@/lib/government-case-bulk-import';
import { supabase } from '@/lib/supabase';

export default function GovernmentCasesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<GovernmentCaseImportResult | null>(null);
  const [currentImporter, setCurrentImporter] = useState<GovernmentCaseBulkImporter | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_approved) {
      loadCases();
    }
  }, [user]);

  useEffect(() => {
    // Filter cases based on search term
    if (searchTerm.trim() === '') {
      setFilteredCases(cases);
    } else {
      const filtered = cases.filter(case_ =>
        case_.ag_file_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.case_parties?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.court_station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.current_case_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.nature_of_claim_new?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCases(filtered);
    }
  }, [searchTerm, cases]);

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      const { data, error } = await supabase
        .from('government_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCases(data || []);
    } catch (error) {
      console.error('Error loading government cases:', error);
      toast({
        title: "Error",
        description: "Failed to load government cases",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleEdit = (case_: any) => {
    setSelectedCase(case_);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedCase(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCase(null);
    toast({
      title: "Success",
      description: selectedCase ? "Case updated successfully" : "Case added successfully",
    });
    loadCases();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      const text = await file.text();
      
      const importer = new GovernmentCaseBulkImporter(user.id);
      setCurrentImporter(importer);
      
      const records = importer.parseCSVData(text);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      const result = await importer.importRecords(records, (progress, message) => {
        setImportProgress(progress);
        console.log(`Import progress: ${progress}% - ${message}`);
      });

      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.imported} cases, skipped ${result.skipped}, found ${result.duplicates} duplicates`,
        });
        loadCases();
      } else {
        toast({
          title: "Import Failed",
          description: "Check the import results for details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setCurrentImporter(null);
      event.target.value = '';
    }
  };

  const cancelImport = () => {
    currentImporter?.cancel();
    setIsImporting(false);
    setImportProgress(0);
    setCurrentImporter(null);
  };

  const getStatusColor = (status: string) => {
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

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user?.is_approved) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Government Cases</h1>
                  <p className="text-gray-600">Manage legal cases against the government</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={isImporting}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Government Cases from CSV</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file containing government case data. The system will automatically map columns and handle missing data.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!isImporting && !importResult && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="csvFile">Select CSV File</Label>
                          <Input
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="mt-2"
                          />
                        </div>
                        
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Expected columns: Serial No, AG File Reference, Court Station, Court Rank, Case No, Case Year, Case Parties, Nature of Claim, Potential Liability, Current Case Status, Ministry, Counsel Dealing, Region, Remarks
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    
                    {isImporting && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Import Progress</span>
                            <span className="text-sm text-gray-500">{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} className="w-full" />
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={cancelImport}
                          className="w-full"
                        >
                          Cancel Import
                        </Button>
                      </div>
                    )}
                    
                    {importResult && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                            <div className="text-sm text-gray-500">Imported</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                            <div className="text-sm text-gray-500">Skipped</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{importResult.duplicates}</div>
                            <div className="text-sm text-gray-500">Duplicates</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                            <div className="text-sm text-gray-500">Errors</div>
                          </div>
                        </div>
                        
                        {importResult.errors.length > 0 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {importResult.errors.length} errors occurred during import. Check console for details.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <Button
                          onClick={() => {
                            setShowImportDialog(false);
                            setImportResult(null);
                          }}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Case
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Input
              placeholder="Search cases by AG reference, parties, court station, status, or nature of claim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </motion.div>

          {/* Cases Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Government Cases ({filteredCases.length})</CardTitle>
                <CardDescription>
                  Legal cases filed against the government and various ministries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCases ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'No cases match your search criteria' : 'No government cases found'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">AG Reference</th>
                          <th className="text-left py-3 font-medium">Court Station</th>
                          <th className="text-left py-3 font-medium">Case No</th>
                          <th className="text-left py-3 font-medium">Year</th>
                          <th className="text-left py-3 font-medium">Parties</th>
                          <th className="text-left py-3 font-medium">Nature of Claim</th>
                          <th className="text-left py-3 font-medium">Status</th>
                          <th className="text-left py-3 font-medium">Quality</th>
                          <th className="text-left py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCases.map((case_, index) => (
                          <tr key={case_.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 font-mono text-xs">
                              {case_.ag_file_reference || '-'}
                            </td>
                            <td className="py-3">{case_.court_station || '-'}</td>
                            <td className="py-3">{case_.case_no || '-'}</td>
                            <td className="py-3">{case_.case_year || '-'}</td>
                            <td className="py-3 max-w-xs truncate" title={case_.case_parties}>
                              {case_.case_parties || '-'}
                            </td>
                            <td className="py-3">{case_.nature_of_claim_new || case_.nature_of_claim_old || '-'}</td>
                            <td className="py-3">
                              <Badge className={getStatusColor(case_.current_case_status)}>
                                {case_.current_case_status || 'Unknown'}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <span className={getQualityColor(case_.data_quality_score || 0)}>
                                {case_.data_quality_score || 0}%
                              </span>
                            </td>
                            <td className="py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(case_)}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <GovernmentCaseForm
            governmentCase={selectedCase}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}