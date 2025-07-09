/**
 * Public Trustees CSV Importer - Handles multiple CSV formats for public trustees data
 * 
 * This module provides comprehensive CSV import functionality for public trustees data,
 * supporting multiple file formats with robust field mapping and data validation.
 * 
 * Features:
 * - Flexible field mapping for different naming conventions
 * - Data quality scoring and validation
 * - Duplicate detection and merging
 * - Progress tracking and error reporting
 * - Batch processing with conflict resolution
 * - Support for 60+ CSV files with varying structures
 */

import { supabase } from './supabase';

export interface PublicTrusteeRecord {
  // Core trustee information
  pt_cause_no?: string;
  folio_no?: string;
  deceased_name?: string;
  
  // Personal information
  gender?: string;
  marital_status?: string;
  date_of_death?: string;
  religion?: string;
  
  // Location information
  county?: string;
  station?: string;
  
  // Estate information
  assets?: string;
  beneficiaries?: string;
  telephone_no?: string;
  
  // Process dates
  date_of_advertisement?: string;
  date_of_confirmation?: string;
  date_account_drawn?: string;
  date_payment_made?: string;
  
  // File information
  file_year?: number;
  original_file_name?: string;
  data_source?: string;
  
  // Data quality and tracking fields
  data_quality_score?: number;
  missing_fields?: string[];
  import_warnings?: any;
  
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

export class PublicTrusteesCSVImporter {
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
      const normalizedRecords: PublicTrusteeRecord[] = [];

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
              console.log(`Processing trustees row ${currentRowNumber}:`, record);
            }
            
            const normalized = this.normalizeRecord(record, fileName || 'unknown.csv', batchId, dataSource);
            
            // Always add records - we'll use upsert to handle duplicates
            normalizedRecords.push(normalized);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Row ${currentRowNumber}: ${errorMessage}`);
            result.skipped++;
            
            // For debugging: log the problematic record structure
            console.warn(`Failed to process trustees record at row ${currentRowNumber}:`, record, 'Error:', errorMessage);
          }
        }
        
        // Report progress
        const progress = Math.round(((i + batchSize) / records.length) * 80); // 80% for processing
        onProgress?.({
          progress,
          message: `Processing trustees records ${i + 1}-${Math.min(i + batchSize, records.length)} of ${records.length}`,
          currentRecord: i + batchSize,
          totalRecords: records.length
        });
      }

      // Insert records to database
      if (normalizedRecords.length > 0) {
        onProgress?.({
          progress: 85,
          message: `Deduplicating and inserting ${normalizedRecords.length} trustee records...`
        });

        // Deduplicate records by pt_cause_no or deceased_name within this batch
        const recordMap = new Map<string, PublicTrusteeRecord>();
        
        for (const record of normalizedRecords) {
          // Use pt_cause_no as primary key, fall back to deceased_name
          const key = record.pt_cause_no || record.deceased_name || `unknown_${Date.now()}_${Math.random()}`;
          
          if (recordMap.has(key)) {
            // Merge with existing record, keeping non-null values
            const existing = recordMap.get(key)!;
            const merged = { ...existing };
            
            // Merge each field, preferring non-null values
            Object.keys(record).forEach(keyName => {
              const typedKey = keyName as keyof PublicTrusteeRecord;
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
          message: `Inserting ${deduplicatedRecords.length} unique trustee records to database...`
        });

        const { data, error } = await supabase
          .from('public_trustees')
          .upsert(deduplicatedRecords, {
            onConflict: 'pt_cause_no',
            ignoreDuplicates: false
          })
          .select('id');

        if (error) {
          // If batch upsert fails, try individual inserts as fallback with enhanced error handling
          console.warn('Batch upsert failed for trustees, attempting individual inserts:', error.message);
          
          let individualSuccess = 0;
          let individualFailures = 0;
          
          for (const record of deduplicatedRecords) {
            try {
              // Try to clean the record before inserting
              const cleanRecord = { ...record };
              
              // Ensure import_warnings is properly formatted as JSONB
              if (cleanRecord.import_warnings && Array.isArray(cleanRecord.import_warnings)) {
                // Convert array to JSON string for database storage
                cleanRecord.import_warnings = cleanRecord.import_warnings as any;
              }
              
              // Ensure missing_fields is properly formatted as array
              if (cleanRecord.missing_fields && !Array.isArray(cleanRecord.missing_fields)) {
                cleanRecord.missing_fields = [];
              }
              
              const { error: individualError } = await supabase
                .from('public_trustees')
                .upsert([cleanRecord], {
                  onConflict: 'pt_cause_no',
                  ignoreDuplicates: false
                });
              
              if (individualError) {
                // Log detailed error for debugging
                console.warn(`Individual record insert failed:`, {
                  record: cleanRecord,
                  error: individualError
                });
                
                // Try to identify specific error types
                let errorMessage = individualError.message;
                if (errorMessage.includes('date/time field value out of range')) {
                  errorMessage = `Date validation error - invalid date format in record`;
                  // Try to insert without dates
                  const recordWithoutDates = { ...cleanRecord };
                  recordWithoutDates.date_of_death = null;
                  recordWithoutDates.date_of_advertisement = null;
                  recordWithoutDates.date_of_confirmation = null;
                  recordWithoutDates.date_account_drawn = null;
                  recordWithoutDates.date_payment_made = null;
                  
                  const { error: retryError } = await supabase
                    .from('public_trustees')
                    .upsert([recordWithoutDates], {
                      onConflict: 'pt_cause_no',
                      ignoreDuplicates: false
                    });
                  
                  if (!retryError) {
                    individualSuccess++;
                    result.warnings = result.warnings || [];
                    result.warnings.push(`Record ${cleanRecord.pt_cause_no || cleanRecord.deceased_name}: Saved without dates due to date format issues`);
                    continue;
                  }
                }
                
                result.errors.push(`Record ${cleanRecord.pt_cause_no || cleanRecord.deceased_name}: ${errorMessage}`);
                individualFailures++;
              } else {
                individualSuccess++;
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              console.warn(`Individual record processing failed:`, {
                record: record.pt_cause_no || record.deceased_name,
                error: errorMessage
              });
              result.errors.push(`Record ${record.pt_cause_no || record.deceased_name}: ${errorMessage}`);
              individualFailures++;
            }
          }
          
          if (individualSuccess > 0) {
            result.imported = individualSuccess;
            result.success = true;
            const message = `Batch insert failed, individual fallback: ${individualSuccess} successful, ${individualFailures} failed`;
            result.warnings = result.warnings || [];
            result.warnings.push(message);
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
    
    if (lowerFileName.includes('pt file') || lowerFileName.includes('pt_file')) {
      return 'pt_file_archive';
    } else if (lowerFileName.includes('ptfile')) {
      return 'ptfile_archive';
    } else if (lowerFileName.includes('pt files') || lowerFileName.includes('pt_files')) {
      return 'pt_files_archive';
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
      
      // Map common variations to standard field names based on analysis
      const mappings: { [key: string]: string } = {
        // Core identification fields
        'pt cause no (station)': 'pt_cause_no',
        'pt cause no': 'pt_cause_no',
        'pt no': 'pt_cause_no',
        'cause no': 'pt_cause_no',
        'cause_no': 'pt_cause_no',
        'pt_cause_number': 'pt_cause_no',
        'pt_cause_no_(station)': 'pt_cause_no',
        'pt_cause_no_station': 'pt_cause_no',
        
        'folio no': 'folio_no',
        'folio_no': 'folio_no',
        'folio': 'folio_no',
        'folio_number': 'folio_no',
        
        'name of the deceased': 'deceased_name',
        'name of deceased': 'deceased_name',
        'deceased name': 'deceased_name',
        'deceased_name': 'deceased_name',
        'name': 'deceased_name',
        'deceased': 'deceased_name',
        
        // Personal information
        'gender': 'gender',
        'sex': 'gender',
        
        'marital status': 'marital_status',
        'marital_status': 'marital_status',
        'status': 'marital_status',
        
        'date of death': 'date_of_death',
        'date_of_death': 'date_of_death',
        'death date': 'date_of_death',
        'death_date': 'date_of_death',
        'died': 'date_of_death',
        
        'religion': 'religion',
        'faith': 'religion',
        
        // Location information
        'county': 'county',
        'location': 'county',
        'district': 'county',
        
        'station': 'station',
        'court station': 'station',
        'court_station': 'station',
        'office': 'station',
        
        // Estate information
        'assets': 'assets',
        'estate': 'assets',
        'property': 'assets',
        'estate value': 'assets',
        'estate_value': 'assets',
        'value': 'assets',
        
        'beneficiaries': 'beneficiaries',
        'beneficiary': 'beneficiaries',
        'heirs': 'beneficiaries',
        'next of kin': 'beneficiaries',
        'next_of_kin': 'beneficiaries',
        
        'telephone no': 'telephone_no',
        'telephone_no': 'telephone_no',
        'phone': 'telephone_no',
        'tel': 'telephone_no',
        'telephone': 'telephone_no',
        'contact': 'telephone_no',
        
        // Process dates
        'date of advertisement': 'date_of_advertisement',
        'date_of_advertisement': 'date_of_advertisement',
        'advertisement date': 'date_of_advertisement',
        'advert date': 'date_of_advertisement',
        'advert_date': 'date_of_advertisement',
        
        'date of confirmation': 'date_of_confirmation',
        'date_of_confirmation': 'date_of_confirmation',
        'confirmation date': 'date_of_confirmation',
        'confirmed': 'date_of_confirmation',
        
        'date account drawn': 'date_account_drawn',
        'date_account_drawn': 'date_account_drawn',
        'account drawn': 'date_account_drawn',
        'account_drawn': 'date_account_drawn',
        
        'date payment made': 'date_payment_made',
        'date_payment_made': 'date_payment_made',
        'payment date': 'date_payment_made',
        'payment_date': 'date_payment_made',
        'paid': 'date_payment_made',
        
        // File information
        'year': 'file_year',
        'file year': 'file_year',
        'file_year': 'file_year',
        
        '': `empty_column_${Math.random().toString(36).substr(2, 5)}` // Handle empty headers uniquely
      };
      
      return mappings[clean] || clean.replace(/[^a-z0-9]/g, '_');
    });
  }

  /**
   * Normalize a single record to the standard format
   */
  private normalizeRecord(record: any, fileName: string, batchId: string, dataSource: string): PublicTrusteeRecord {
    // Extract fields with fallbacks - allow empty values for flexible imports
    const ptCauseNo = record.pt_cause_no || record.cause_no || record.pt_no || '';
    const deceasedName = record.deceased_name || record.name || record.deceased || '';
    
    // Generate unique identifier if both primary fields are missing
    let finalPtCauseNo = ptCauseNo;
    if (!finalPtCauseNo || finalPtCauseNo.trim() === '') {
      if (deceasedName && deceasedName.trim() !== '') {
        // Use deceased name as basis for PT cause number
        finalPtCauseNo = `AUTO_${deceasedName.replace(/[^a-zA-Z0-9]/g, '').substr(0, 10)}_${Date.now()}`;
      } else {
        // Last resort: generate unique identifier
        finalPtCauseNo = `IMPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Parse dates safely with comprehensive validation
    const parseDate = (dateStr: string | undefined): string | undefined => {
      if (!dateStr || typeof dateStr !== 'string') return undefined;
      
      try {
        const cleanDate = dateStr.trim();
        if (!cleanDate || cleanDate.toLowerCase() === 'null') return undefined;
        
        // Handle DD/MM/YYYY or MM/DD/YYYY format
        if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
          const parts = cleanDate.split('/');
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          
          // Convert 2-digit years to 4-digit
          if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
          }
          
          // Validate date components
          if (month < 1 || month > 12) {
            console.warn(`Invalid month in date: ${dateStr} (month=${month})`);
            return undefined;
          }
          
          if (day < 1 || day > 31) {
            console.warn(`Invalid day in date: ${dateStr} (day=${day})`);
            return undefined;
          }
          
          // Additional validation for days in specific months
          const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          if (day > daysInMonth[month - 1]) {
            console.warn(`Invalid day for month in date: ${dateStr} (day=${day}, month=${month})`);
            return undefined;
          }
          
          // Special validation for February in non-leap years
          if (month === 2 && day === 29) {
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            if (!isLeapYear) {
              console.warn(`Invalid leap day in non-leap year: ${dateStr}`);
              return undefined;
            }
          }
          
          // Validate year range (reasonable bounds for trustee records)
          if (year < 1900 || year > new Date().getFullYear() + 1) {
            console.warn(`Year out of reasonable range: ${dateStr} (year=${year})`);
            return undefined;
          }
          
          // Create and validate ISO date string (assuming DD/MM/YYYY format)
          const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          // Final validation by creating a Date object
          const testDate = new Date(isoDate);
          if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
            console.warn(`Date validation failed: ${dateStr} -> ${isoDate}`);
            return undefined;
          }
          
          return isoDate;
        } 
        
        // Handle ISO format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
        else if (cleanDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          const datePart = cleanDate.substr(0, 10);
          const parts = datePart.split('-');
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          
          // Validate components
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.warn(`Invalid date components in ISO format: ${dateStr}`);
            return undefined;
          }
          
          // Validate by creating Date object
          const testDate = new Date(datePart);
          if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
            console.warn(`ISO date validation failed: ${dateStr}`);
            return undefined;
          }
          
          return datePart;
        }
        
        // Handle DD-MM-YYYY format
        else if (cleanDate.match(/^\d{1,2}-\d{1,2}-\d{2,4}$/)) {
          const parts = cleanDate.split('-');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          
          if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
          }
          
          // Same validation as DD/MM/YYYY
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.warn(`Invalid date components: ${dateStr}`);
            return undefined;
          }
          
          const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const testDate = new Date(isoDate);
          if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
            console.warn(`Date validation failed: ${dateStr} -> ${isoDate}`);
            return undefined;
          }
          
          return isoDate;
        }
        
        // Handle European dot format (DD.MM.YYYY, DD.M.YYYY, D.M.YY)
        else if (cleanDate.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/)) {
          const parts = cleanDate.split('.');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          
          // Convert 2-digit years to 4-digit (European style)
          if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
          }
          
          // Validate date components
          if (month < 1 || month > 12) {
            console.warn(`Invalid month in European date: ${dateStr} (month=${month})`);
            return undefined;
          }
          
          if (day < 1 || day > 31) {
            console.warn(`Invalid day in European date: ${dateStr} (day=${day})`);
            return undefined;
          }
          
          // Additional validation for days in specific months
          const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          if (day > daysInMonth[month - 1]) {
            console.warn(`Invalid day for month in European date: ${dateStr} (day=${day}, month=${month})`);
            return undefined;
          }
          
          // Special validation for February in non-leap years
          if (month === 2 && day === 29) {
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            if (!isLeapYear) {
              console.warn(`Invalid leap day in non-leap year: ${dateStr}`);
              return undefined;
            }
          }
          
          // Validate year range
          if (year < 1900 || year > new Date().getFullYear() + 1) {
            console.warn(`Year out of reasonable range in European date: ${dateStr} (year=${year})`);
            return undefined;
          }
          
          // Create and validate ISO date string
          const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          // Final validation by creating a Date object
          const testDate = new Date(isoDate);
          if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
            console.warn(`European date validation failed: ${dateStr} -> ${isoDate}`);
            return undefined;
          }
          
          return isoDate;
        }
        
        // If no format matches, log and return undefined
        if (!cleanDate.match(/^(null|undefined|\d{4,})$/i)) {
          console.warn(`Unrecognized date format: ${dateStr}`);
        }
        return undefined;
        
      } catch (err) {
        console.warn(`Date parsing error for '${dateStr}':`, err);
        return undefined;
      }
    };

    // Parse file year from filename
    const parseFileYear = (fileName: string): number | undefined => {
      const yearMatch = fileName.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        if (year >= 1900 && year <= new Date().getFullYear()) {
          return year;
        }
      }
      return undefined;
    };

    // Track import warnings for data quality
    const importWarnings: string[] = [];
    
    // Try to parse dates and track failures
    const dateOfDeathStr = record.date_of_death || record.death_date || record.died;
    const dateOfAdvertisementStr = record.date_of_advertisement || record.advert_date;
    const dateOfConfirmationStr = record.date_of_confirmation || record.confirmed;
    const dateAccountDrawnStr = record.date_account_drawn || record.account_drawn;
    const datePaymentMadeStr = record.date_payment_made || record.payment_date || record.paid;
    
    const dateOfDeath = parseDate(dateOfDeathStr);
    const dateOfAdvertisement = parseDate(dateOfAdvertisementStr);
    const dateOfConfirmation = parseDate(dateOfConfirmationStr);
    const dateAccountDrawn = parseDate(dateAccountDrawnStr);
    const datePaymentMade = parseDate(datePaymentMadeStr);
    
    // Track date parsing issues
    if (dateOfDeathStr && !dateOfDeath) {
      importWarnings.push(`Invalid date of death: ${dateOfDeathStr}`);
    }
    if (dateOfAdvertisementStr && !dateOfAdvertisement) {
      importWarnings.push(`Invalid advertisement date: ${dateOfAdvertisementStr}`);
    }
    if (dateOfConfirmationStr && !dateOfConfirmation) {
      importWarnings.push(`Invalid confirmation date: ${dateOfConfirmationStr}`);
    }
    if (dateAccountDrawnStr && !dateAccountDrawn) {
      importWarnings.push(`Invalid account drawn date: ${dateAccountDrawnStr}`);
    }
    if (datePaymentMadeStr && !datePaymentMade) {
      importWarnings.push(`Invalid payment made date: ${datePaymentMadeStr}`);
    }
    
    // Track missing critical fields
    if (!deceasedName || deceasedName.trim() === '') {
      importWarnings.push('Deceased name is missing');
    }
    
    // Calculate data quality score
    const totalFields = 18; // Total possible fields
    let filledFields = 0;
    
    const fieldsToCheck = [
      finalPtCauseNo, record.folio_no || record.folio, deceasedName, record.gender || record.sex,
      record.marital_status || record.status, dateOfDeath, record.religion || record.faith,
      record.county || record.location, record.station || record.office, record.assets || record.estate,
      record.beneficiaries || record.beneficiary, record.telephone_no || record.phone,
      dateOfAdvertisement, dateOfConfirmation, dateAccountDrawn, datePaymentMade,
      parseFileYear(fileName), fileName
    ];
    
    fieldsToCheck.forEach(field => {
      if (field && field.toString().trim() !== '') {
        filledFields++;
      }
    });
    
    const dataQualityScore = Math.round((filledFields / totalFields) * 100);
    
    // Identify missing fields for tracking
    const missingFields: string[] = [];
    if (!finalPtCauseNo) missingFields.push('pt_cause_no');
    if (!record.folio_no && !record.folio) missingFields.push('folio_no');
    if (!deceasedName) missingFields.push('deceased_name');
    if (!record.gender && !record.sex) missingFields.push('gender');
    if (!record.marital_status && !record.status) missingFields.push('marital_status');
    if (!dateOfDeath) missingFields.push('date_of_death');
    if (!record.religion && !record.faith) missingFields.push('religion');
    if (!record.county && !record.location) missingFields.push('county');
    if (!record.station && !record.office) missingFields.push('station');
    if (!record.assets && !record.estate) missingFields.push('assets');
    if (!record.beneficiaries && !record.beneficiary) missingFields.push('beneficiaries');

    return {
      pt_cause_no: finalPtCauseNo.trim() || null,
      folio_no: record.folio_no || record.folio || null,
      deceased_name: deceasedName.trim() || null,
      gender: record.gender || record.sex || null,
      marital_status: record.marital_status || record.status || null,
      date_of_death: dateOfDeath,
      religion: record.religion || record.faith || null,
      county: record.county || record.location || record.district || null,
      station: record.station || record.office || record.court_station || null,
      assets: record.assets || record.estate || record.property || record.value || null,
      beneficiaries: record.beneficiaries || record.beneficiary || record.heirs || record.next_of_kin || null,
      telephone_no: record.telephone_no || record.phone || record.tel || record.telephone || record.contact || null,
      date_of_advertisement: dateOfAdvertisement,
      date_of_confirmation: dateOfConfirmation,
      date_account_drawn: dateAccountDrawn,
      date_payment_made: datePaymentMade,
      file_year: parseFileYear(fileName),
      original_file_name: fileName,
      data_source: dataSource,
      data_quality_score: dataQualityScore,
      missing_fields: missingFields,
      import_warnings: importWarnings,
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
    return `trustees_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    console.log(`Trustees batch ${batchId} status: ${status}`, { errorMessage, stats });
  }
}