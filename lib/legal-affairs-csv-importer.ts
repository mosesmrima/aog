/**
 * Legal Affairs CSV Importer
 * Handles bulk import of legal cases from CSV files
 * Supports all 11 analyzed file formats with data normalization
 */

import { supabase } from './supabase';

export interface LegalAffairsCaseRecord {
  // Core identifiers
  ag_file_reference: string;
  serial_no?: string;
  
  // Court information
  court_station: string;
  court_rank?: string;
  
  // Case details
  case_no?: string;
  case_year?: number;
  case_parties: string;
  
  // Nature of claim (using existing table structure)
  nature_of_claim_new?: string;
  nature_of_claim_old?: string;
  
  // Financial information (using existing field)
  potential_liability_kshs?: string;
  
  // Status and progress
  current_case_status: string;
  remarks?: string;
  
  // Administrative
  ministry?: string;
  counsel_dealing?: string;
  region?: string;
  
  // Metadata
  created_by: string;
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
        
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const currentRowNumber = i + j + 1;
          
          try {
            // Special debugging for first few rows
            if (currentRowNumber <= 3) {
              console.log(`Processing row ${currentRowNumber}:`, record);
            }
            
            const normalized = this.normalizeRecord(record, fileName || 'unknown.csv', batchId);
            
            // Always add records - we'll use upsert to handle duplicates
            // This allows updating existing records with new/additional information
            normalizedRecords.push(normalized);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Row ${currentRowNumber}: ${errorMessage}`);
            result.skipped++;
            
            // For debugging: log the problematic record structure
            console.warn(`Failed to process record at row ${currentRowNumber}:`, record, 'Error:', errorMessage);
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
          .from('government_cases')
          .upsert(normalizedRecords, {
            onConflict: 'ag_file_reference',
            ignoreDuplicates: false
          })
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
        'serial no.': 'serial_no',
        'serial no': 'serial_no',
        'sheet name': 'sheet_name',
        'ag file reference': 'ag_file_reference',
        'court station': 'court_station',
        'court rank': 'court_rank',
        'court': 'court_rank',
        'case no': 'case_no',
        'case': 'case_year',
        'case year': 'case_year',
        'case parties': 'case_parties',
        'nature of the claim new': 'nature_of_claim_new',
        'nature of claim (new)': 'nature_of_claim_new',
        'nature of claim new': 'nature_of_claim_new',
        'nature of the claim old': 'nature_of_claim_old',
        'potential liability (kshs)': 'potential_liability_kshs',
        'potential liability (ksh)': 'potential_liability_kshs',
        'potential liability': 'potential_liability_kshs',
        'current case status': 'current_case_status',
        'counsel dealing': 'counsel_dealing',
        'ministry': 'ministry',
        'region': 'region',
        'remarks': 'remarks',
        '': `empty_column_${Math.random().toString(36).substr(2, 5)}` // Handle empty headers uniquely
      };
      
      return mappings[clean] || clean.replace(/[^a-z0-9]/g, '_');
    });
  }

  /**
   * Normalize a single record to the standard format
   */
  private normalizeRecord(record: any, fileName: string, batchId: string): LegalAffairsCaseRecord {
    // Extract fields with fallbacks - allow empty values for flexible imports
    const agFileRef = record.ag_file_reference || record.ag_ref || '';
    const courtStation = record.court_station || '';
    const caseParties = record.case_parties || '';
    const caseStatus = record.current_case_status || '';

    // Generate AG File Reference if missing, using available data
    let finalAgFileRef = agFileRef;
    if (!finalAgFileRef || finalAgFileRef.trim() === '') {
      // Try to construct from other available fields
      const caseNo = record.case_no || '';
      const year = record.case_year || '';
      const station = courtStation || '';
      
      if (caseNo && year) {
        finalAgFileRef = `${station}/${caseNo}/${year}`;
      } else if (caseNo) {
        finalAgFileRef = `${station}/${caseNo}`;
      } else {
        // Last resort: generate a unique identifier
        finalAgFileRef = `IMPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Get liability amount as string (existing table uses text field)
    const liabilityRaw = record.potential_liability_kshs || '';

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
      ag_file_reference: finalAgFileRef.trim(),
      serial_no: record.serial_no || null,
      court_station: courtStation.trim() || null,
      court_rank: record.court_rank || null,
      case_no: record.case_no || null,
      case_year: caseYear || null,
      case_parties: caseParties.trim() || null,
      nature_of_claim_new: record.nature_of_claim_new || null,
      nature_of_claim_old: record.nature_of_claim_old || null,
      potential_liability_kshs: liabilityRaw || null,
      current_case_status: caseStatus.trim() || null,
      remarks: record.remarks || null,
      ministry: record.ministry || null,
      counsel_dealing: record.counsel_dealing || null,
      region: record.region || null,
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
      .from('government_cases')
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
   * Create import batch record (simplified - no tracking table)
   */
  private async createImportBatch(fileName: string, totalRecords: number): Promise<string> {
    // Generate a simple batch ID since we don't have import tracking table
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    console.log(`Batch ${batchId} status: ${status}`, { errorMessage, stats });
  }
}