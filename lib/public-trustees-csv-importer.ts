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
   * Normalize headers to consistent field names based on comprehensive analysis
   */
  private normalizeHeaders(headers: string[]): string[] {
    return headers.map(header => {
      const clean = header.toLowerCase().trim();
      
      // Comprehensive field mappings based on analysis of all 60 CSV files
      const mappings: { [key: string]: string } = {
        // PT Cause No variations (3 found)
        'pt cause no (station)': 'pt_cause_no',
        'pt cause no (station).1': 'pt_cause_no',
        'p': 'pt_cause_no',
        'pt cause no': 'pt_cause_no',
        'pt no': 'pt_cause_no',
        'cause no': 'pt_cause_no',
        'cause_no': 'pt_cause_no',
        'pt_cause_number': 'pt_cause_no',
        'pt_cause_no_(station)': 'pt_cause_no',
        'pt_cause_no_station': 'pt_cause_no',
        
        // Folio No variations (3 found)
        'folio no': 'folio_no',
        'folio no.1': 'folio_no',
        'f': 'folio_no',
        'folio_no': 'folio_no',
        'folio': 'folio_no',
        'folio_number': 'folio_no',
        
        // Deceased Name variations (33 found) - includes many unnamed columns
        'name of the deceased': 'deceased_name',
        'name of the deceased.1': 'deceased_name',
        'name of deceased': 'deceased_name',
        'deceased name': 'deceased_name',
        'deceased_name': 'deceased_name',
        'name': 'deceased_name',
        'deceased': 'deceased_name',
        // Handle unnamed columns that actually contain deceased names
        'unnamed: 0': 'deceased_name',
        'unnamed: 1': 'deceased_name',
        'unnamed: 8': 'deceased_name',
        'unnamed: 20': 'deceased_name',
        'unnamed: 21': 'deceased_name',
        'unnamed: 22': 'deceased_name',
        'unnamed: 23': 'deceased_name',
        'unnamed: 24': 'deceased_name',
        'unnamed: 25': 'deceased_name',
        'unnamed: 26': 'deceased_name',
        'unnamed: 27': 'deceased_name',
        'unnamed: 28': 'deceased_name',
        'unnamed: 29': 'deceased_name',
        'unnamed: 30': 'deceased_name',
        'unnamed: 31': 'deceased_name',
        'unnamed: 32': 'deceased_name',
        'unnamed: 33': 'deceased_name',
        'unnamed: 34': 'deceased_name',
        'unnamed: 35': 'deceased_name',
        'unnamed: 36': 'deceased_name',
        'unnamed: 37': 'deceased_name',
        'unnamed: 38': 'deceased_name',
        'unnamed: 39': 'deceased_name',
        'unnamed: 40': 'deceased_name',
        'unnamed: 41': 'deceased_name',
        'unnamed: 42': 'deceased_name',
        'unnamed: 43': 'deceased_name',
        'unnamed: 44': 'deceased_name',
        'unnamed: 45': 'deceased_name',
        'unnamed: 46': 'deceased_name',
        
        // Gender variations (2 found)
        'gender': 'gender',
        'gender.1': 'gender',
        'sex': 'gender',
        
        // Marital Status variations (2 found)
        'marital status': 'marital_status',
        'marital status.1': 'marital_status',
        'marital_status': 'marital_status',
        'status': 'marital_status',
        
        // Date of Death variations (3 found)
        'date of death': 'date_of_death',
        'date of death.1': 'date_of_death',
        'date_of_death': 'date_of_death',
        'death date': 'date_of_death',
        'death_date': 'date_of_death',
        'died': 'date_of_death',
        
        // Religion variations (3 found)
        'religion': 'religion',
        'religion.1': 'religion',
        'faith': 'religion',
        
        // County variations (2 found)
        'county': 'county',
        'county.1': 'county',
        'location': 'county',
        'district': 'county',
        
        // Station variations (3 found)
        'station': 'station',
        'court station': 'station',
        'court_station': 'station',
        'office': 'station',
        
        // Assets variations (6 found)
        'assets': 'assets',
        'shares': 'assets',
        'shares.1': 'assets',
        'assets being transmitted': 'assets',
        'assets being transmitted.1': 'assets',
        'estate': 'assets',
        'property': 'assets',
        'estate value': 'assets',
        'estate_value': 'assets',
        'value': 'assets',
        
        // Beneficiaries variations (8 found)
        'beneficiaries/date of birth/idno': 'beneficiaries',
        'beneficiaries/ date of birth/ id no.': 'beneficiaries',
        'beneficiaries/ date of birth/ id no..1': 'beneficiaries',
        'telephone of beneficiary': 'beneficiaries',
        'telephone of beneficiary.1': 'beneficiaries',
        'telephone no of the beneficiary': 'beneficiaries',
        'no of beneficiary': 'beneficiaries',
        'beneficiaries': 'beneficiaries',
        'beneficiary': 'beneficiaries',
        'heirs': 'beneficiaries',
        'next of kin': 'beneficiaries',
        'next_of_kin': 'beneficiaries',
        
        // Telephone variations (5 found)
        'telephone no': 'telephone_no',
        'telephone_no': 'telephone_no',
        'phone': 'telephone_no',
        'tel': 'telephone_no',
        'telephone': 'telephone_no',
        'contact': 'telephone_no',
        
        // Date Advertisement variations (5 found)
        'date of advertisement': 'date_of_advertisement',
        'date_of_advertisement': 'date_of_advertisement',
        'date of advertisement for claims': 'date_of_advertisement',
        'date advertisement for claims': 'date_of_advertisement',
        'date advertisementfor claims': 'date_of_advertisement',
        'advertisement date': 'date_of_advertisement',
        'advert date': 'date_of_advertisement',
        'advert_date': 'date_of_advertisement',
        
        // Date Confirmation variations (3 found)
        'date of confirmation': 'date_of_confirmation',
        'date_of_confirmation': 'date_of_confirmation',
        'date of confirmation of grants': 'date_of_confirmation',
        'date of confirmation of grants': 'date_of_confirmation',
        'confirmation date': 'date_of_confirmation',
        'confirmed': 'date_of_confirmation',
        
        // Date Account Drawn variations (2 found)
        'date account drawn': 'date_account_drawn',
        'date_account_drawn': 'date_account_drawn',
        'account drawn': 'date_account_drawn',
        'account_drawn': 'date_account_drawn',
        
        // Date Payment Made variations (3 found)
        'date payment made': 'date_payment_made',
        'date_payment_made': 'date_payment_made',
        'payment date': 'date_payment_made',
        'payment_date': 'date_payment_made',
        'paid': 'date_payment_made',
        
        // File Year variations (2 found)
        'year': 'file_year',
        'file year': 'file_year',
        'file_year': 'file_year',
        
        // Serial Number variations (11 found)
        'serial number': 'serial_number',
        'serial_number': 'serial_number',
        's/no': 'serial_number',
        'sno': 'serial_number',
        'no': 'serial_number',
        'serial no': 'serial_number',
        'sr no': 'serial_number',
        'sr_no': 'serial_number',
        '1': 'serial_number',
        '2': 'serial_number',
        '3': 'serial_number',
        
        // Additional date fields found in analysis
        'date of advertisements for objections': 'date_of_objections',
        'advertisent for objection': 'date_of_objections',
        'date of certificate of summary administration': 'date_of_certificate',
        'certificate of summary': 'date_of_certificate',
        'date of temporary grant of letters of administration': 'date_of_temporary_grant',
        'temporary of grants administration': 'date_of_temporary_grant',
        'date of transmission': 'date_of_transmission',
        'date of transmission': 'date_of_transmission',
        
        // Handle empty headers uniquely
        '': `empty_column_${Math.random().toString(36).substr(2, 5)}`,
        'unnamed: 47': `empty_column_${Math.random().toString(36).substr(2, 5)}`,
        'unnamed: 48': `empty_column_${Math.random().toString(36).substr(2, 5)}`,
        'unnamed: 49': `empty_column_${Math.random().toString(36).substr(2, 5)}`
      };
      
      // If no exact mapping found, try fuzzy matching for common patterns
      if (!mappings[clean]) {
        // Check for telephone variations
        if (clean.includes('telephone') || clean.includes('phone') || clean.includes('tel')) {
          return 'telephone_no';
        }
        // Check for date variations
        if (clean.includes('date') && clean.includes('death')) {
          return 'date_of_death';
        }
        if (clean.includes('date') && (clean.includes('advert') || clean.includes('claim'))) {
          return 'date_of_advertisement';
        }
        if (clean.includes('date') && clean.includes('confirm')) {
          return 'date_of_confirmation';
        }
        if (clean.includes('date') && clean.includes('account')) {
          return 'date_account_drawn';
        }
        if (clean.includes('date') && clean.includes('payment')) {
          return 'date_payment_made';
        }
        // Check for beneficiary variations
        if (clean.includes('beneficiar') || clean.includes('heir') || clean.includes('next of kin')) {
          return 'beneficiaries';
        }
        // Check for assets variations
        if (clean.includes('asset') || clean.includes('estate') || clean.includes('property') || clean.includes('value')) {
          return 'assets';
        }
        // Handle files column
        if (clean.includes('file') && !clean.includes('year')) {
          return 'files';
        }
        
        // Default: clean and normalize
        return clean.replace(/[^a-z0-9]/g, '_');
      }
      
      return mappings[clean];
    });
  }

  /**
   * Normalize a single record to the standard format
   */
  private normalizeRecord(record: any, fileName: string, batchId: string, dataSource: string): PublicTrusteeRecord {
    // Extract fields with comprehensive fallbacks using the new mapping system
    const ptCauseNo = record.pt_cause_no || record.cause_no || record.pt_no || record.p || '';
    const deceasedName = record.deceased_name || record.name || record.deceased || record.f || '';
    
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

    // Simple date cleaning - store as TEXT without parsing
    const cleanDate = (dateStr: string | undefined): string | null => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      
      const cleaned = dateStr.trim();
      
      // Return null for obviously empty values
      if (!cleaned || 
          cleaned.toLowerCase() === 'null' || 
          cleaned.toLowerCase() === 'undefined' || 
          cleaned === '' ||
          cleaned === '/' ||
          cleaned === '-') {
        return null;
      }
      
      // Return the cleaned text as-is for database storage
      return cleaned;
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
    
    // Clean dates without parsing - store as TEXT
    const dateOfDeathStr = record.date_of_death || record.death_date || record.died;
    const dateOfAdvertisementStr = record.date_of_advertisement || record.advert_date;
    const dateOfConfirmationStr = record.date_of_confirmation || record.confirmed;
    const dateAccountDrawnStr = record.date_account_drawn || record.account_drawn;
    const datePaymentMadeStr = record.date_payment_made || record.payment_date || record.paid;
    
    const dateOfDeath = cleanDate(dateOfDeathStr);
    const dateOfAdvertisement = cleanDate(dateOfAdvertisementStr);
    const dateOfConfirmation = cleanDate(dateOfConfirmationStr);
    const dateAccountDrawn = cleanDate(dateAccountDrawnStr);
    const datePaymentMade = cleanDate(datePaymentMadeStr);
    
    // No date parsing warnings - just note if critical fields are missing
    if (!dateOfDeath && dateOfDeathStr) {
      importWarnings.push(`Date of death field present but empty`);
    }
    
    // Track missing critical fields
    if (!deceasedName || deceasedName.trim() === '') {
      importWarnings.push('Deceased name is missing');
    }
    
    // Calculate data quality score based on field completeness
    const totalFields = 18; // Total possible fields
    let filledFields = 0;
    
    const fieldsToCheck = [
      finalPtCauseNo, 
      record.folio_no || record.folio, 
      deceasedName, 
      record.gender || record.sex,
      record.marital_status || record.status, 
      dateOfDeath, 
      record.religion || record.faith,
      record.county || record.location, 
      record.station || record.office, 
      record.assets || record.estate,
      record.beneficiaries || record.beneficiary, 
      record.telephone_no || record.phone,
      dateOfAdvertisement, 
      dateOfConfirmation, 
      dateAccountDrawn, 
      datePaymentMade,
      parseFileYear(fileName), 
      fileName
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
      folio_no: record.folio_no || record.folio || record.f || null,
      deceased_name: deceasedName.trim() || null,
      gender: record.gender || record.sex || null,
      marital_status: record.marital_status || record.status || null,
      date_of_death: dateOfDeath,
      religion: record.religion || record.faith || record.f || null,
      county: record.county || record.location || record.district || null,
      station: record.station || record.office || record.court_station || null,
      assets: record.assets || record.estate || record.property || record.value || record.shares || record.p || null,
      beneficiaries: record.beneficiaries || record.beneficiary || record.heirs || record.next_of_kin || record.f || null,
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