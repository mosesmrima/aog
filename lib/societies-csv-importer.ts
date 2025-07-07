/**
 * Societies CSV Importer - Handles multiple CSV formats for society registrations
 * 
 * This module provides comprehensive CSV import functionality for societies data,
 * supporting multiple file formats with robust field mapping and data validation.
 * 
 * Supported formats:
 * 1. SOCIETIES_MAIN.csv - Core registration data
 * 2. thblexeption.csv - Exempted societies 
 * 3. list of societies registered through ecitizen.csv - Digital registrations
 * 
 * Features:
 * - Flexible field mapping for different naming conventions
 * - Data quality scoring and validation
 * - Duplicate detection and merging
 * - Progress tracking and error reporting
 * - Batch processing with conflict resolution
 */

import { supabase } from './supabase';

export interface SocietyRecord {
  // Core registration information
  registration_number?: string;
  society_name?: string;
  registration_date?: string;
  file_number?: string;
  
  // Location and contact information
  registry_office?: string;
  address?: string;
  
  // Society details
  nature_of_society?: string;
  member_class?: string;
  member_count?: number;
  
  // Leadership information
  chairman_name?: string;
  secretary_name?: string;
  treasurer_name?: string;
  
  // Exemption information
  exemption_number?: string;
  exemption_date?: string;
  
  // E-citizen registration information
  application_number?: string;
  service_type?: string;
  submitted_by?: string;
  registration_status?: string;
  
  // Additional information
  comments?: string;
  data_source?: string;
  
  // Audit fields
  created_by: string;
}

export interface ImportProgress {
  progress: number; // 0-100
  message: string;
  currentRecord?: number;
  totalRecords?: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  duplicates: number;
  errors: string[];
  warnings: string[];
}

export class SocietiesCSVImporter {
  private userId: string;
  private abortController: AbortController;

  constructor(userId: string) {
    this.userId = userId;
    this.abortController = new AbortController();
  }

  /**
   * Cancel the current import operation
   */
  cancel(): void {
    this.abortController.abort();
  }

  /**
   * Parse CSV text into structured records
   */
  parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse headers and normalize them
    const headers = this.parseCSVLine(lines[0]);
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    const records: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (this.abortController.signal.aborted) break;
      
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      
      const record: any = {};
      
      // Map values to normalized headers
      for (let j = 0; j < Math.min(headers.length, values.length); j++) {
        const originalHeader = headers[j];
        const normalizedHeader = normalizedHeaders[j];
        const value = values[j]?.trim();
        
        if (value && value !== '' && value.toLowerCase() !== 'null') {
          record[normalizedHeader] = value;
          
          // Also store original header mapping for debugging
          if (originalHeader !== normalizedHeader) {
            record[`_original_${normalizedHeader}`] = originalHeader;
          }
        }
      }
      
      // Skip empty records
      if (Object.keys(record).length > 1) {
        records.push(record);
      }
    }
    
    return records;
  }

  /**
   * Import records with progress tracking
   */
  async importRecords(
    records: any[],
    onProgress?: (progress: ImportProgress) => void,
    fileName?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [],
      warnings: []
    };

    try {
      if (records.length === 0) {
        throw new Error('No records to import');
      }

      // Determine data source from filename
      const dataSource = this.determineDataSource(fileName || 'unknown.csv');
      
      const batchId = await this.createImportBatch(fileName || 'unknown.csv', records.length);
      const batchSize = 50; // Process in smaller batches
      const normalizedRecords: SocietyRecord[] = [];

      // Process records in batches
      for (let i = 0; i < records.length; i += batchSize) {
        if (this.abortController.signal.aborted) {
          await this.updateBatchStatus(batchId, 'cancelled');
          throw new Error('Import cancelled');
        }
        
        const batch = records.slice(i, Math.min(i + batchSize, records.length));
        
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const currentRowNumber = i + j + 1;
          
          try {
            // Special debugging for first few rows
            if (currentRowNumber <= 3) {
              console.log(`Processing societies row ${currentRowNumber}:`, record);
            }
            
            const normalized = this.normalizeRecord(record, fileName || 'unknown.csv', batchId, dataSource);
            
            // Always add records - we'll use upsert to handle duplicates
            normalizedRecords.push(normalized);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Row ${currentRowNumber}: ${errorMessage}`);
            result.skipped++;
            
            // For debugging: log the problematic record structure
            console.warn(`Failed to process societies record at row ${currentRowNumber}:`, record, 'Error:', errorMessage);
          }
        }
        
        // Report progress
        const progress = Math.round(((i + batchSize) / records.length) * 80); // 80% for processing
        onProgress?.({
          progress,
          message: `Processing societies records ${i + 1}-${Math.min(i + batchSize, records.length)} of ${records.length}`,
          currentRecord: i + batchSize,
          totalRecords: records.length
        });
      }

      // Insert records to database
      if (normalizedRecords.length > 0) {
        onProgress?.({
          progress: 85,
          message: `Deduplicating and inserting ${normalizedRecords.length} society records...`
        });

        // Deduplicate records by registration_number or society_name within this batch
        const recordMap = new Map<string, SocietyRecord>();
        
        for (const record of normalizedRecords) {
          // Use registration_number as primary key, fall back to society_name
          const key = record.registration_number || record.society_name || `unknown_${Date.now()}_${Math.random()}`;
          
          if (recordMap.has(key)) {
            // Merge with existing record, keeping non-null values
            const existing = recordMap.get(key)!;
            const merged = { ...existing };
            
            // Merge each field, preferring non-null values
            Object.keys(record).forEach(keyName => {
              const typedKey = keyName as keyof SocietyRecord;
              const newValue = record[typedKey];
              if (newValue !== null && newValue !== undefined && newValue !== '') {
                (merged as any)[typedKey] = newValue;
              }
            });
            
            recordMap.set(key, merged);
            result.duplicates++;
          } else {
            recordMap.set(key, record);
          }
        }
        
        const deduplicatedRecords = Array.from(recordMap.values());

        onProgress?.({
          progress: 87,
          message: `Inserting ${deduplicatedRecords.length} unique society records to database...`
        });

        const { data, error } = await supabase
          .from('societies')
          .upsert(deduplicatedRecords, {
            onConflict: 'registration_number',
            ignoreDuplicates: false
          })
          .select('id');

        if (error) {
          // If batch upsert fails, try individual inserts as fallback
          console.warn('Batch upsert failed for societies, attempting individual inserts:', error.message);
          
          let individualSuccess = 0;
          let individualFailures = 0;
          
          for (const record of deduplicatedRecords) {
            try {
              const { error: individualError } = await supabase
                .from('societies')
                .upsert([record], {
                  onConflict: 'registration_number',
                  ignoreDuplicates: false
                });
              
              if (individualError) {
                result.errors.push(`Record ${record.registration_number || record.society_name}: ${individualError.message}`);
                individualFailures++;
              } else {
                individualSuccess++;
              }
            } catch (err) {
              result.errors.push(`Record ${record.registration_number || record.society_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
              individualFailures++;
            }
          }
          
          if (individualSuccess > 0) {
            result.imported = individualSuccess;
            result.success = true;
            result.errors.push(`Batch insert failed, individual fallback: ${individualSuccess} successful, ${individualFailures} failed`);
          } else {
            result.errors.push(`Database error: ${error.message}`);
            await this.updateBatchStatus(batchId, 'failed', error.message);
          }
        } else {
          result.imported = data?.length || 0;
          result.success = true;
        }
        
        // Update batch with final statistics
        if (result.success) {
          await this.updateBatchStatus(batchId, 'completed', undefined, {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors.length
          });
        }
      }

      onProgress?.({
        progress: 100,
        message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.duplicates} duplicates merged`
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      result.success = false;
      return result;
    }
  }

  /**
   * Determine data source from filename
   */
  private determineDataSource(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('societies_main') || lowerFileName.includes('registered societies')) {
      return 'main_registry';
    } else if (lowerFileName.includes('exemption') || lowerFileName.includes('exempt')) {
      return 'exempted_societies';
    } else if (lowerFileName.includes('ecitizen') || lowerFileName.includes('e-citizen')) {
      return 'ecitizen_registration';
    } else {
      return 'unknown_source';
    }
  }

  /**
   * Normalize headers to consistent field names
   */
  private normalizeHeaders(headers: string[]): string[] {
    return headers.map(header => {
      const clean = header.toLowerCase().trim();
      
      // Map common variations to standard field names
      const mappings: { [key: string]: string } = {
        // Main registry fields
        'reg_no': 'registration_number',
        'reg no': 'registration_number',
        'registration no': 'registration_number',
        'society_name': 'society_name',
        'socname': 'society_name',
        'name': 'society_name',
        'reg_date': 'registration_date',
        'reg date': 'registration_date',
        'date': 'registration_date',
        'file_no': 'file_number',
        'file no': 'file_number',
        'fileno': 'file_number',
        'reg_office': 'registry_office',
        'reg office': 'registry_office',
        'address': 'address',
        'nature': 'nature_of_society',
        'member_class': 'member_class',
        'member class': 'member_class',
        'member_no': 'member_count',
        'member no': 'member_count',
        'chairman': 'chairman_name',
        'secretary': 'secretary_name',
        'treasury': 'treasurer_name',
        'identification': 'treasurer_name', // Alternative field for treasurer
        'comments': 'comments',
        
        // Exemption fields
        'exp-no': 'exemption_number',
        'exp no': 'exemption_number',
        'exemption no': 'exemption_number',
        
        // E-citizen fields
        'app number': 'application_number',
        'application number': 'application_number',
        'service': 'service_type',
        'submitted by': 'submitted_by',
        'stage': 'registration_status',
        'status': 'registration_status',
        
        '': `empty_column_${Math.random().toString(36).substr(2, 5)}` // Handle empty headers uniquely
      };
      
      return mappings[clean] || clean.replace(/[^a-z0-9]/g, '_');
    });
  }

  /**
   * Normalize a single record to the standard format
   */
  private normalizeRecord(record: any, fileName: string, batchId: string, dataSource: string): SocietyRecord {
    // Extract fields with fallbacks - allow empty values for flexible imports
    const registrationNumber = record.registration_number || record.reg_no || '';
    const societyName = record.society_name || record.socname || record.name || '';
    
    // Generate unique identifier if both primary fields are missing
    let finalRegistrationNumber = registrationNumber;
    if (!finalRegistrationNumber || finalRegistrationNumber.trim() === '') {
      if (societyName && societyName.trim() !== '') {
        // Use society name as basis for registration number
        finalRegistrationNumber = `AUTO_${societyName.replace(/[^a-zA-Z0-9]/g, '').substr(0, 10)}_${Date.now()}`;
      } else {
        // Last resort: generate unique identifier
        finalRegistrationNumber = `IMPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Parse dates safely
    const parseDate = (dateStr: string | undefined): string | undefined => {
      if (!dateStr || typeof dateStr !== 'string') return undefined;
      
      try {
        // Handle various date formats
        const cleanDate = dateStr.trim();
        if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
          // Handle DD/MM/YYYY or MM/DD/YYYY format
          const parts = cleanDate.split('/');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          // Convert 2-digit years to 4-digit
          const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
          
          // Create ISO date string (assuming DD/MM/YYYY format for registrations)
          return `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        } else if (cleanDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Already in ISO format
          return cleanDate.substr(0, 10);
        }
      } catch (err) {
        console.warn(`Failed to parse date: ${dateStr}`, err);
      }
      
      return undefined;
    };

    // Parse member count safely
    const parseMemberCount = (countStr: string | undefined): number | undefined => {
      if (!countStr || typeof countStr !== 'string') return undefined;
      const parsed = parseInt(countStr.replace(/[^0-9]/g, ''));
      return isNaN(parsed) ? undefined : parsed;
    };

    return {
      registration_number: finalRegistrationNumber.trim(),
      society_name: societyName.trim() || null,
      registration_date: parseDate(record.registration_date || record.reg_date || record.date),
      file_number: record.file_number || record.file_no || record.fileno || null,
      registry_office: record.registry_office || record.reg_office || null,
      address: record.address || null,
      nature_of_society: record.nature_of_society || record.nature || null,
      member_class: record.member_class || null,
      member_count: parseMemberCount(record.member_count || record.member_no),
      chairman_name: record.chairman_name || record.chairman || null,
      secretary_name: record.secretary_name || record.secretary || null,
      treasurer_name: record.treasurer_name || record.treasury || record.identification || null,
      exemption_number: record.exemption_number || record.exp_no || null,
      exemption_date: parseDate(record.exemption_date),
      application_number: record.application_number || record.app_number || null,
      service_type: record.service_type || record.service || null,
      submitted_by: record.submitted_by || null,
      registration_status: record.registration_status || record.stage || record.status || null,
      comments: record.comments || null,
      data_source: dataSource,
      created_by: this.userId
    };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  /**
   * Create import batch record (simplified - no tracking table)
   */
  private async createImportBatch(fileName: string, totalRecords: number): Promise<string> {
    // Generate a simple batch ID since we don't have import tracking table
    return `societies_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update import batch status (simplified - no tracking table)
   */
  private async updateBatchStatus(
    batchId: string, 
    status: string,
    errorMessage?: string,
    stats?: { imported: number; skipped: number; errors: number }
  ): Promise<void> {
    // Log batch status for debugging (since we don't have import tracking table)
    console.log(`Societies batch ${batchId} status: ${status}`, { errorMessage, stats });
  }
}