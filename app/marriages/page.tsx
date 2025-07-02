'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { OptimizedMarriagesTable } from '@/components/marriages/optimized-marriages-table';
import { MarriageForm } from '@/components/marriages/marriage-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { MarriageBulkImporter } from '@/lib/bulk-import';

export default function MarriagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedMarriage, setSelectedMarriage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  const handleEdit = (marriage: any) => {
    setSelectedMarriage(marriage);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedMarriage(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMarriage(null);
    toast({
      title: 'Success',
      description: selectedMarriage ? 'Marriage updated successfully' : 'Marriage created successfully',
    });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMarriage(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file. Excel files should be converted to CSV first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      // Read file content
      console.log('Reading file content...');
      const fileContent = await file.text();
      console.log('File content length:', fileContent.length);
      
      // Initialize importer
      console.log('Initializing importer with user ID:', user.id);
      const importer = new MarriageBulkImporter(user.id);
      
      // Parse CSV data
      console.log('Parsing CSV data...');
      const records = importer.parseCSVData(fileContent);
      console.log('Parsed records count:', records.length);
      
      if (records.length === 0) {
        toast({
          title: 'No valid records found',
          description: 'The CSV file does not contain any valid marriage records.',
          variant: 'destructive',
        });
        return;
      }

      // Validate data
      const validation = importer.validateImportData(records);
      
      if (!validation.valid) {
        toast({
          title: 'Invalid data',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('Import warnings:', validation.warnings);
      }

      toast({
        title: 'Starting import',
        description: `Processing ${records.length} marriage records...`,
      });

      // Import records with progress tracking
      const result = await importer.importRecords(records, (imported, total) => {
        const progress = Math.round((imported / total) * 100);
        setImportProgress(progress);
      });

      setImportResult(result);

      if (result.success) {
        toast({
          title: 'Import completed successfully',
          description: `Imported ${result.imported} records. ${result.duplicates} duplicates skipped.`,
        });
        
        // TanStack Query will automatically refresh the data
      } else {
        toast({
          title: 'Import failed',
          description: `Failed to import records. ${result.errors.length} errors occurred.`,
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      toast({
        title: 'Import failed',
        description: error?.message || 'An unexpected error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    // Create a CSV template
    const headers = [
      'marriage_date',
      'groom_name', 
      'bride_name',
      'place_of_marriage',
      'certificate_number',
      'license_type'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
      '2024-01-15,John Smith,Jane Doe,Registrar Office,MC001,Special License\n' +
      '2024-01-16,Bob Johnson,Alice Brown,Church,MC002,Regular Certificate';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marriage_records_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const hasEditAccess = user?.departments?.includes('Registrar of Marriages') || user?.is_admin;

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
          {showForm ? (
            <MarriageForm
              marriage={selectedMarriage}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Marriage Records
                    </h1>
                    <p className="text-gray-600">
                      Manage marriage registrations and certificates
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex items-center space-x-2"
                          disabled={!hasEditAccess}
                        >
                          <Upload className="w-4 h-4" />
                          <span>Bulk Import</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-5 h-5" />
                            <span>Bulk Import Marriage Records</span>
                          </DialogTitle>
                          <DialogDescription>
                            Upload a CSV file to import multiple marriage records at once.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {!isImporting && !importResult && (
                          <>
                            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                              <CardContent className="p-6 text-center">
                                <div className="space-y-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                                    <Upload className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Upload CSV File</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                      CSV format only. Convert Excel files to CSV before uploading.
                                    </p>
                                    <input
                                      type="file"
                                      accept=".csv"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                      id="file-upload"
                                      disabled={isImporting}
                                    />
                                    <label
                                      htmlFor="file-upload"
                                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      Choose CSV File
                                    </label>
                                  </div>
                                  <div className="pt-4 border-t border-gray-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={downloadTemplate}
                                      className="text-xs"
                                    >
                                      Download Template
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Use our template to ensure proper formatting
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Expected format:</strong> DATE, NAME OF GROOM, NAME OF BRIDE, PLACE OF MARRIAGE, MARRIAGE CERTIFICATE NUMBER, REGISTRAR'S CERTIFICATE/SPECIAL LICENSE, FILES
                              </AlertDescription>
                            </Alert>
                          </>
                        )}

                        {isImporting && (
                          <div className="space-y-4">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                              <h3 className="font-medium text-gray-900 mb-2">Importing Records</h3>
                              <p className="text-sm text-gray-600">Processing marriage records...</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{importProgress}%</span>
                              </div>
                              <Progress value={importProgress} className="w-full" />
                            </div>
                          </div>
                        )}

                        {importResult && (
                          <div className="space-y-4">
                            <div className="text-center">
                              {importResult.success ? (
                                <CheckCircle className="w-8 h-8 mx-auto mb-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
                              )}
                              <h3 className="font-medium text-gray-900 mb-2">
                                {importResult.success ? 'Import Completed' : 'Import Failed'}
                              </h3>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Records Imported:</span>
                                <span className="font-medium text-green-600">{importResult.imported}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Duplicates Skipped:</span>
                                <span className="font-medium text-amber-600">{importResult.duplicates}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Records Skipped:</span>
                                <span className="font-medium text-gray-600">{importResult.skipped}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Errors:</span>
                                <span className="font-medium text-red-600">{importResult.errors.length}</span>
                              </div>
                            </div>

                            {importResult.errors.length > 0 && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  {importResult.errors.length} errors occurred during import. Check the console for details.
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setImportResult(null);
                                  setImportProgress(0);
                                }}
                              >
                                Import Another File
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowImportDialog(false);
                                  setImportResult(null);
                                  setImportProgress(0);
                                }}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      onClick={handleAdd}
                      className="flex items-center space-x-2"
                      disabled={!hasEditAccess}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </Button>
                  </div>
                </div>
              </motion.div>

              <OptimizedMarriagesTable
                onEdit={handleEdit}
                onAdd={handleAdd}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}