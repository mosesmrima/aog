'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SocietiesCSVImporter, ImportResult, ImportProgress } from '@/lib/societies-csv-importer';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function SocietiesCSVImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: CSVImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validation = SocietiesCSVImporter.validateCSVFile(file);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    setSelectedFile(file);
    setImportResult(null);
    setImportProgress(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setImportResult(null);
    setImportProgress(null);
    
    try {
      const importer = new SocietiesCSVImporter((progress) => {
        setImportProgress(progress);
      });
      
      const result = await importer.importFromCSV(selectedFile);
      setImportResult(result);
      
      if (result.success) {
        onImportComplete();
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportProgress(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetDialog, 300);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Registered Name', 'registration_date', 'registration_number'],
      ['GABRIEL PRISCILLA FOUNDATION', '2022-09-01', 'SOC-2ETPZQ'],
      ['NEWNESS SOCIETY', '2023-05-09', 'SOCA-QPTKRPE'],
      ['JOSKA ONE AND NEIGHBOURS RESIDENTS ASSOCIATION', '2022-10-13', 'SOC-DETDW']
    ];
    
    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'societies-sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Import Societies from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import societies data. The file should contain columns for society name, registration date, and registration number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sample CSV Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Need a sample CSV?</h4>
              <p className="text-sm text-blue-700">Download a sample CSV file with the correct format</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </Button>
          </div>

          {/* CSV Format Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CSV Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">Required</Badge>
                    <div className="text-sm font-medium">Registered Name</div>
                    <div className="text-xs text-gray-500">Society name</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2">Optional</Badge>
                    <div className="text-sm font-medium">registration_date</div>
                    <div className="text-xs text-gray-500">YYYY-MM-DD format</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2">Optional</Badge>
                    <div className="text-sm font-medium">registration_number</div>
                    <div className="text-xs text-gray-500">Unique identifier</div>
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Important:</strong> The CSV must have a header row with column names. 
                    Only the "Registered Name" column is required - other fields can be empty.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 justify-center">
                      <Button
                        onClick={handleImport}
                        disabled={isImporting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={resetDialog}
                        disabled={isImporting}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">
                        Drop your CSV file here, or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports CSV files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {importProgress && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{importProgress.percentage}%</span>
                  </div>
                  <Progress value={importProgress.percentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Processing: {importProgress.currentRecord} ({importProgress.processed} of {importProgress.total})
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className={importResult.success ? 'border-green-200' : 'border-red-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    Import {importResult.success ? 'Successful' : 'Failed'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">{importResult.message}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{importResult.totalRecords}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{importResult.successfulRecords}</div>
                        <div className="text-xs text-gray-500">Successful</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{importResult.failedRecords}</div>
                        <div className="text-xs text-gray-500">Failed</div>
                      </div>
                    </div>
                    
                    {importResult.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <ul className="text-sm space-y-1">
                            {importResult.errors.map((error, index) => (
                              <li key={index} className="text-red-700">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}