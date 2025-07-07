/**
 * Legal Affairs CSV Importer
 * Handles bulk import of legal cases from CSV files
 * Supports all 11 analyzed file formats with data normalization
 */

import { supabase } from './supabase';

export interface LegalAffairsCaseRecord {
  // Core identifiers
  ag_file_reference: string;
  serial_number?: string;
  
  // Court information
  court_station: string;
  court_rank?: string;
  court?: string;
  
  // Case details
  case_number?: string;
  case_year?: number;
  case_parties: string;
  
  // Nature of claim
  nature_of_claim?: string;
  nature_of_claim_old?: string;
  
  // Financial information
  potential_liability?: number;
  potential_liability_raw?: string;
  
  // Status and progress
  current_case_status: string;
  remarks?: string;
  
  // Administrative
  ministry?: string;
  counsel_dealing?: string;
  region?: string;
  sheet_name?: string;
  
  // Metadata
  file_source: string;
  import_batch_id: string;
}

export interface ImportResult {
  success: boolean;
  batchId: string;
  imported: number;
  skipped: number;
  errors: string[];
  duplicates: number;
  totalRecords: number;
}

export interface ImportProgress {
  progress: number;
  message: string;
  currentRecord?: number;
  totalRecords?: number;
}

export class LegalAffairsCSVImporter {
  private userId: string;
  private abortController: AbortController;

  constructor(userId: string) {
    this.userId = userId;
    this.abortController = new AbortController();
  }

  /**
   * Cancel the import process
   */
  cancel(): void {
    this.abortController.abort();
  }

  /**
   * Parse CSV data and normalize column variations
   */
  parseCSVData(csvText: string): any[] {
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
    
    try {
      // Create import batch
      const batchId = await this.createImportBatch(fileName || 'unknown.csv', records.length);
      
      const result: ImportResult = {
        success: false,
        batchId,
        imported: 0,
        skipped: 0,
        errors: [],
        duplicates: 0,
        totalRecords: records.length
      };

      // Update batch status to processing
      await this.updateBatchStatus(batchId, 'processing');

      const normalizedRecords: LegalAffairsCaseRecord[] = [];
      
      // Process records in batches of 50
      const batchSize = 50;
      
      for (let i = 0; i < records.length; i += batchSize) {
        if (this.abortController.signal.aborted) {
          await this.updateBatchStatus(batchId, 'failed', 'Import cancelled by user');
          throw new Error('Import cancelled');
        }
        
        const batch = records.slice(i, Math.min(i + batchSize, records.length));
        
        for (const record of batch) {
          try {
            const normalized = this.normalizeRecord(record, fileName || 'unknown.csv', batchId);
            
            // Check for duplicates
            const isDuplicate = await this.checkForDuplicate(normalized.ag_file_reference);
            
            if (isDuplicate) {
              result.duplicates++;
              continue;
            }
            
            normalizedRecords.push(normalized);
            
          } catch (error) {
            result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.skipped++;
          }
        }
        
        // Report progress
        const progress = Math.round(((i + batchSize) / records.length) * 80); // 80% for processing
        onProgress?.({
          progress,
          message: `Processing records ${i + 1}-${Math.min(i + batchSize, records.length)} of ${records.length}`,
          currentRecord: i + batchSize,
          totalRecords: records.length
        });
      }

      // Insert records to database
      if (normalizedRecords.length > 0) {
        onProgress?.({
          progress: 85,
          message: `Inserting ${normalizedRecords.length} records to database...`
        });

        const { data, error } = await supabase
          .from('legal_affairs_cases')
          .insert(normalizedRecords)
          .select('id');

        if (error) {
          result.errors.push(`Database error: ${error.message}`);
          await this.updateBatchStatus(batchId, 'failed', error.message);
        } else {
          result.imported = data?.length || 0;
          result.success = true;
          
          // Update batch with final statistics
          await this.updateBatchStatus(batchId, 'completed', undefined, {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors.length
          });
        }
      }

      onProgress?.({
        progress: 100,
        message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.duplicates} duplicates`
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onProgress?.({
        progress: 0,
        message: `Import failed: ${errorMessage}`
      });

      return {
        success: false,
        batchId: '',
        imported: 0,
        skipped: 0,
        errors: [errorMessage],
        duplicates: 0,
        totalRecords: records.length
      };
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
        'serial no.': 'serial_number',
        'serial no': 'serial_number',
        'sheet name': 'sheet_name',
        'ag file reference': 'ag_file_reference',
        'court station': 'court_station',
        'court rank': 'court_rank',
        'case no': 'case_number',
        'case': 'case_year',
        'case year': 'case_year',
        'case parties': 'case_parties',
        'nature of the claim new': 'nature_of_claim',
        'nature of claim (new)': 'nature_of_claim',
        'nature of the claim old': 'nature_of_claim_old',
        'potential liability (kshs)': 'potential_liability_raw',
        'potential liability (ksh)': 'potential_liability_raw',
        'current case status': 'current_case_status',
        'counsel dealing': 'counsel_dealing',
        '': 'index_field' // Handle empty column headers
      };
      
      return mappings[clean] || clean.replace(/[^a-z0-9]/g, '_');
    });
  }

  /**
   * Normalize a single record to the standard format
   */
  private normalizeRecord(record: any, fileName: string, batchId: string): LegalAffairsCaseRecord {
    // Extract and validate required fields
    const agFileRef = record.ag_file_reference || record.ag_ref || '';
    const courtStation = record.court_station || '';
    const caseParties = record.case_parties || '';
    const caseStatus = record.current_case_status || '';

    if (!agFileRef || !courtStation || !caseParties || !caseStatus) {
      throw new Error(`Missing required fields: AG File Reference, Court Station, Case Parties, or Case Status`);
    }

    // Parse liability amount
    const liabilityRaw = record.potential_liability_raw || '';
    let liability: number | undefined;
    
    if (liabilityRaw) {
      // Remove commas, currency symbols, and extract numeric value
      const numericValue = liabilityRaw.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(numericValue);
      if (!isNaN(parsed) && parsed > 0) {
        liability = parsed;
      }
    }

    // Parse case year
    let caseYear: number | undefined;
    const yearField = record.case_year || record.case;
    if (yearField) {
      const parsed = parseInt(yearField.toString());
      if (!isNaN(parsed) && parsed > 1900 && parsed <= new Date().getFullYear() + 10) {
        caseYear = parsed;
      }
    }

    return {
      ag_file_reference: agFileRef,
      serial_number: record.serial_number,
      court_station: courtStation,
      court_rank: record.court_rank,
      court: record.court,
      case_number: record.case_number,
      case_year: caseYear,
      case_parties: caseParties,
      nature_of_claim: record.nature_of_claim,
      nature_of_claim_old: record.nature_of_claim_old,
      potential_liability: liability,
      potential_liability_raw: liabilityRaw || undefined,
      current_case_status: caseStatus,
      remarks: record.remarks,
      ministry: record.ministry,
      counsel_dealing: record.counsel_dealing,
      region: record.region,
      sheet_name: record.sheet_name,
      file_source: fileName,
      import_batch_id: batchId
    };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Check if a case already exists
   */
  private async checkForDuplicate(agFileReference: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('legal_affairs_cases')
      .select('id')
      .eq('ag_file_reference', agFileReference)
      .limit(1);

    if (error) {
      console.warn('Error checking for duplicates:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Create import batch record
   */
  private async createImportBatch(fileName: string, totalRecords: number): Promise<string> {
    const { data, error } = await supabase
      .from('legal_affairs_import_batches')
      .insert({
        file_name: fileName,
        total_records: totalRecords,
        created_by: this.userId,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create import batch: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Update import batch status
   */
  private async updateBatchStatus(
    batchId: string, 
    status: string, 
    errorMessage?: string,
    stats?: { imported: number; skipped: number; errors: number }
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    if (stats) {
      updateData.imported_records = stats.imported;
      updateData.skipped_records = stats.skipped;
      updateData.error_records = stats.errors;
    }

    await supabase
      .from('legal_affairs_import_batches')
      .update(updateData)
      .eq('id', batchId);
  }
}