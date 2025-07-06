'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';

// Flexible schema allowing all fields to be optional except core ones
const governmentCaseSchema = z.object({
  serial_no: z.string().optional().nullable(),
  ag_file_reference: z.string().optional().nullable(),
  court_station: z.string().optional().nullable(),
  court_rank: z.string().optional().nullable(),
  case_no: z.string().optional().nullable(),
  case_year: z.number().int().min(1900).max(2100).optional().nullable(),
  case_parties: z.string().optional().nullable(),
  nature_of_claim_old: z.string().optional().nullable(),
  nature_of_claim_new: z.string().optional().nullable(),
  potential_liability_kshs: z.string().optional().nullable(),
  current_case_status: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  ministry: z.string().optional().nullable(),
  counsel_dealing: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
});

type GovernmentCaseData = z.infer<typeof governmentCaseSchema>;

interface GovernmentCaseFormProps {
  governmentCase?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Common dropdown options based on CSV data
const COURT_STATIONS = ['Mombasa', 'Kwale', 'Taveta', 'Kilifi', 'Kaloleni', 'Msambweni'];
const COURT_RANKS = ['ELC', 'CMC', 'PMC', 'SRMC', 'SPMC', 'CMC ELC', 'SPMC ELC'];
const CASE_STATUSES = [
  'Matter has a mention date',
  'Matter has a hearing date', 
  'Judgment delivered',
  'Matter at appeal',
  'Matter pending ruling',
  'File closed',
  'Concluded pending tax',
  'Awaiting judgment',
  'New matter yet to comply'
];
const NATURE_OF_CLAIMS = [
  'Land claim',
  'Declaration',
  'Cancellation of title',
  'Land Fraud',
  'Compulsory acquisition',
  'Appropriation of public land',
  'Specific Performance',
  'Breach of terms of contract',
  'Damages (General, Specific)',
  'Injuction/Conservatory Order',
  'Certiorari',
  'Eviction'
];
const REGIONS = ['Mombasa', 'Coast', 'Nairobi', 'Central Kenya', 'Western Kenya', 'Eastern Kenya', 'Northern Kenya'];

export function GovernmentCaseForm({ governmentCase, onSuccess, onCancel }: GovernmentCaseFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [dataQuality, setDataQuality] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const form = useForm<GovernmentCaseData>({
    resolver: zodResolver(governmentCaseSchema),
    defaultValues: governmentCase || {
      serial_no: '',
      ag_file_reference: '',
      court_station: '',
      court_rank: '',
      case_no: '',
      case_year: null,
      case_parties: '',
      nature_of_claim_old: '',
      nature_of_claim_new: '',
      potential_liability_kshs: '',
      current_case_status: '',
      remarks: '',
      ministry: '',
      counsel_dealing: '',
      region: '',
    },
  });

  const watchedValues = form.watch();

  // Calculate data quality score in real-time
  useEffect(() => {
    const allFields = [
      'ag_file_reference', 'court_station', 'court_rank', 'case_no', 'case_year',
      'case_parties', 'nature_of_claim_new', 'current_case_status', 'ministry',
      'counsel_dealing', 'region'
    ];
    
    const filledFields = allFields.filter(field => {
      const value = watchedValues[field as keyof GovernmentCaseData];
      return value && value.toString().trim() !== '';
    });
    
    const missing = allFields.filter(field => {
      const value = watchedValues[field as keyof GovernmentCaseData];
      return !value || value.toString().trim() === '';
    });
    
    const quality = Math.round((filledFields.length / allFields.length) * 100);
    setDataQuality(quality);
    setMissingFields(missing);
  }, [watchedValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `government-cases/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (!uploadError) {
        uploadedUrls.push(filePath);
      }
      
      setUploadProgress(((i + 1) / totalFiles) * 100);
    }
    
    return uploadedUrls;
  };

  const onSubmit = async (data: GovernmentCaseData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files if any
      const uploadedFiles = await uploadFiles();
      
      // Calculate case year from case_no if not provided
      let caseYear = data.case_year;
      if (!caseYear && data.case_no) {
        const yearMatch = data.case_no.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          caseYear = parseInt(yearMatch[0]);
        }
      }
      
      const caseData = {
        ...data,
        case_year: caseYear,
        files: JSON.stringify(uploadedFiles),
        data_quality_score: dataQuality,
        missing_fields: missingFields,
        import_warnings: [],
        created_by: user.id,
      };
      
      let result;
      if (governmentCase?.id) {
        // Update existing case
        result = await supabase
          .from('government_cases')
          .update(caseData)
          .eq('id', governmentCase.id);
      } else {
        // Create new case
        result = await supabase
          .from('government_cases')
          .insert([caseData]);
      }
      
      if (result.error) throw result.error;
      
      onSuccess();
    } catch (error) {
      console.error('Error saving government case:', error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {governmentCase ? 'Edit Government Case' : 'Add New Government Case'}
              </CardTitle>
              <CardDescription>
                Fill in the case details. All fields are optional to handle incomplete data.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getQualityBadgeVariant(dataQuality)}>
                Data Quality: {dataQuality}%
              </Badge>
              {dataQuality >= 80 && <CheckCircle className="w-4 h-4 text-green-600" />}
              {dataQuality < 80 && <AlertCircle className="w-4 h-4 text-yellow-600" />}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Case Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial_no">Serial Number</Label>
                <Input
                  id="serial_no"
                  {...form.register('serial_no')}
                  placeholder="e.g., 8182"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ag_file_reference">AG File Reference</Label>
                <Input
                  id="ag_file_reference"
                  {...form.register('ag_file_reference')}
                  placeholder="e.g., CIV 152/2020"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="court_station">Court Station</Label>
                <Select onValueChange={(value) => form.setValue('court_station', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select court station" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURT_STATIONS.map((station) => (
                      <SelectItem key={station} value={station}>{station}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="court_rank">Court Rank</Label>
                <Select onValueChange={(value) => form.setValue('court_rank', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select court rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURT_RANKS.map((rank) => (
                      <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="case_no">Case Number</Label>
                <Input
                  id="case_no"
                  {...form.register('case_no')}
                  placeholder="e.g., 92 of 2020"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="case_year">Case Year</Label>
                <Input
                  id="case_year"
                  type="number"
                  min="1900"
                  max="2100"
                  {...form.register('case_year', { valueAsNumber: true })}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>
            
            {/* Case Parties */}
            <div className="space-y-2">
              <Label htmlFor="case_parties">Case Parties</Label>
              <Textarea
                id="case_parties"
                {...form.register('case_parties')}
                placeholder="e.g., Chunky Ltd and another vs Chief Land Registrar"
                rows={2}
              />
            </div>
            
            {/* Nature of Claims */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nature_of_claim_old">Nature of Claim (Old)</Label>
                <Input
                  id="nature_of_claim_old"
                  {...form.register('nature_of_claim_old')}
                  placeholder="e.g., Land claim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nature_of_claim_new">Nature of Claim (New)</Label>
                <Select onValueChange={(value) => form.setValue('nature_of_claim_new', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nature of claim" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURE_OF_CLAIMS.map((claim) => (
                      <SelectItem key={claim} value={claim}>{claim}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Financial and Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potential_liability_kshs">Potential Liability (KSHS)</Label>
                <Input
                  id="potential_liability_kshs"
                  {...form.register('potential_liability_kshs')}
                  placeholder="e.g., 1,200,000,000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current_case_status">Current Case Status</Label>
                <Select onValueChange={(value) => form.setValue('current_case_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ministry">Ministry</Label>
                <Input
                  id="ministry"
                  {...form.register('ministry')}
                  placeholder="e.g., Ministry of Lands, Public Works, Housing and Urban Development"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="counsel_dealing">Counsel Dealing</Label>
                <Input
                  id="counsel_dealing"
                  {...form.register('counsel_dealing')}
                  placeholder="e.g., Martin Mwandeje"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select onValueChange={(value) => form.setValue('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...form.register('remarks')}
                placeholder="Additional remarks or notes about the case"
                rows={3}
              />
            </div>
            
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="files">Case Documents</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {files.length > 0 && (
                <div className="text-sm text-gray-600">
                  {files.length} file(s) selected
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
            
            {/* Data Quality Alert */}
            {dataQuality < 60 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data quality is below 60%. Consider filling in more fields: {missingFields.join(', ')}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    {governmentCase ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {governmentCase ? 'Update Case' : 'Save Case'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}