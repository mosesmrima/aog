'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LegalAffairsCSVImporter, ImportResult, ImportProgress } from '@/lib/legal-affairs-csv-importer';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  userId: string;
}

export function CSVImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete, 
  userId 
}: CSVImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ progress: 0, message: '' });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [currentImporter, setCurrentImporter] = useState<LegalAffairsCSVImporter | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setPreviewData(null);

    // Generate preview
    try {
      const text = await file.text();
      const importer = new LegalAffairsCSVImporter(userId);
      const records = importer.parseCSVData(text);
      setPreviewData(records.slice(0, 5)); // Show first 5 records
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Could not read the CSV file. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !userId) return;

    try {
      setIsImporting(true);
      setImportProgress({ progress: 0, message: 'Starting import...' });
      setImportResult(null);

      const text = await selectedFile.text();
      const importer = new LegalAffairsCSVImporter(userId);
      setCurrentImporter(importer);
      
      const records = importer.parseCSVData(text);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      const result = await importer.importRecords(
        records, 
        (progress) => setImportProgress(progress),
        selectedFile.name
      );

      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.imported} cases, skipped ${result.skipped}, found ${result.duplicates} duplicates`,
        });
        onImportComplete();
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
    }
  };

  const handleCancel = () => {
    if (currentImporter) {
      currentImporter.cancel();
    }
    setIsImporting(false);
    setImportProgress({ progress: 0, message: '' });
    setCurrentImporter(null);
  };

  const handleClose = () => {
    if (isImporting) {
      handleCancel();
    }
    onOpenChange(false);
    // Reset state
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setImportProgress({ progress: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `AG FILE REFERENCE,COURT STATION,CASE PARTIES,NATURE OF THE CLAIM NEW,POTENTIAL LIABILITY (KSHS),CURRENT CASE STATUS,REMARKS,CASE NO,CASE YEAR,COURT RANK,MINISTRY,COUNSEL DEALING,REGION
CIV 152/2020,Mombasa,John Doe vs Attorney General,Land Fraud,1200000,Matter has a mention date,Issue instructions,92 of 2020,2020,ELC,Ministry of Lands,Martin Mwandeje,Mombasa`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'legal_affairs_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Import Legal Affairs Cases from CSV</span>
          </DialogTitle>
          <DialogDescription>
            Upload CSV files containing legal case data. The system will automatically detect and map columns from various formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          {!isImporting && !importResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Select CSV File</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose CSV File</span>
                </Button>
                
                {selectedFile && (
                  <div className="mt-4 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Supported formats:</strong> The importer can handle various column layouts including AG File Reference, Court Station, Case Parties, Nature of Claim, Potential Liability, Current Case Status, and more. Missing columns will be handled gracefully.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Preview Section */}
          {previewData && !isImporting && !importResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Preview</CardTitle>
                  <CardDescription>
                    First 5 records from your CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(previewData[0] || {}).slice(0, 6).map((key) => (
                            <th key={key} className="text-left p-2 font-medium">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 3).map((record, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(record).slice(0, 6).map((value: any, i) => (
                              <td key={i} className="p-2 max-w-xs truncate">
                                {String(value || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary">
                      {previewData.length} records detected
                    </Badge>
                    <Button onClick={handleImport} className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Start Import</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Importing Cases</span>
                  </CardTitle>
                  <CardDescription>
                    Processing your CSV file and importing cases to the database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-500">{importProgress.progress}%</span>
                    </div>
                    <Progress value={importProgress.progress} className="w-full" />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {importProgress.message}
                  </div>
                  
                  {importProgress.currentRecord && importProgress.totalRecords && (
                    <div className="text-xs text-gray-500">
                      Record {importProgress.currentRecord} of {importProgress.totalRecords}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    Cancel Import
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Import Results */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>Import {importResult.success ? 'Completed' : 'Failed'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.imported}
                      </div>
                      <div className="text-sm text-gray-500">Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {importResult.skipped}
                      </div>
                      <div className="text-sm text-gray-500">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.duplicates}
                      </div>
                      <div className="text-sm text-gray-500">Duplicates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.errors.length}
                      </div>
                      <div className="text-sm text-gray-500">Errors</div>
                    </div>
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">
                          {importResult.errors.length} errors occurred:
                        </div>
                        <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-red-600">
                              • {error}
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <div className="text-gray-500">
                              ... and {importResult.errors.length - 10} more errors
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportResult(null);
                        setSelectedFile(null);
                        setPreviewData(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="flex-1"
                    >
                      Import Another File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}