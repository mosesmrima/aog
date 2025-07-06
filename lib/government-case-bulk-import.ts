import { supabase } from './supabase';

export interface GovernmentCaseImportRecord {
  serial_no?: string | null;
  ag_file_reference?: string | null;
  court_station?: string | null;
  court_rank?: string | null;
  case_no?: string | null;
  case_year?: number | null;
  case_parties?: string | null;
  nature_of_claim_old?: string | null;
  nature_of_claim_new?: string | null;
  potential_liability_kshs?: string | null;
  current_case_status?: string | null;
  remarks?: string | null;
  ministry?: string | null;
  counsel_dealing?: string | null;
  region?: string | null;
  data_quality_score?: number;
  missing_fields?: string[];
  import_warnings?: string[];
}

export interface GovernmentCaseImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  duplicates: number;
}

export class GovernmentCaseBulkImporter {
  private batchSize = 50;
  private cancelled = false;
  private globalAgRefSet = new Set<string>();
  
  constructor(private userId: string) {}

  cancel() {
    this.cancelled = true;
    console.log('Government case import cancelled by user');
  }

  /**
   * Parse CSV data and convert to import format
   */
  parseCSVData(csvContent: string): GovernmentCaseImportRecord[] {
    try {
      console.log('Starting government case CSV parsing...');
      const lines = csvContent.split('\n');
      console.log('Total lines in CSV:', lines.length);
      const records: GovernmentCaseImportRecord[] = [];
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      // Parse header to map column names
      const headerLine = lines[0].trim();
      const headers = this.parseCSVLine(headerLine);
      console.log('CSV Headers:', headers);
      
      // Create column mapping (case-insensitive)
      const columnMap = this.createColumnMapping(headers);
      console.log('Column mapping:', columnMap);
      
      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        try {
          const values = this.parseCSVLine(line);
          const record = this.mapRowToRecord(values, columnMap, i + 1);
          if (record) {
            records.push(record);
          }
        } catch (error) {
          console.warn(`Error parsing line ${i + 1}:`, error);
          // Continue processing other lines
        }
      }
      
      console.log(`Parsed ${records.length} government case records`);
      return records;
    } catch (error) {
      console.error('Error parsing government case CSV:', error);
      throw error;
    }
  }

  /**
   * Parse a CSV line handling quoted values
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
   * Create mapping between CSV columns and database fields
   */
  private createColumnMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    // Define possible column name variations
    const columnVariations: Record<string, string[]> = {
      'serial_no': ['serial no.', 'serial no', 'serial_no', 'serial number'],
      'ag_file_reference': ['ag file reference', 'ag_file_reference', 'file reference', 'ag file ref'],
      'court_station': ['court station', 'court_station', 'station'],
      'court_rank': ['court rank', 'court_rank', 'rank'],
      'case_no': ['case no', 'case_no', 'case number'],
      'case_year': ['case year', 'case_year', 'year'],
      'case_parties': ['case parties', 'case_parties', 'parties'],
      'nature_of_claim_old': ['nature of the claim old', 'nature_of_claim_old', 'claim old'],
      'nature_of_claim_new': ['nature of the claim new', 'nature_of_claim_new', 'claim new'],
      'potential_liability_kshs': ['potential liability (kshs)', 'potential_liability_kshs', 'liability'],
      'current_case_status': ['current case status', 'current_case_status', 'status'],
      'remarks': ['remarks', 'notes'],
      'ministry': ['ministry', 'ministry department'],
      'counsel_dealing': ['counsel dealing', 'counsel_dealing', 'counsel'],
      'region': ['region', 'area']
    };
    
    // Map headers to database fields
    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      
      for (const [dbField, variations] of Object.entries(columnVariations)) {
        if (variations.some(variation => cleanHeader.includes(variation))) {
          mapping[dbField] = index;
          break;
        }
      }
    });
    
    return mapping;
  }

  /**
   * Map CSV row values to database record
   */
  private mapRowToRecord(
    values: string[], 
    columnMap: Record<string, number>, 
    rowNumber: number
  ): GovernmentCaseImportRecord | null {
    try {
      const record: GovernmentCaseImportRecord = {};
      const warnings: string[] = [];
      const missingFields: string[] = [];
      
      // Map each field
      Object.entries(columnMap).forEach(([field, index]) => {
        if (index < values.length) {
          let value = values[index]?.trim() || null;
          
          // Clean up empty values
          if (value === '' || value === '-' || value === 'N/A') {
            value = null;
          }
          
          // Special handling for specific fields
          if (field === 'case_year' && value) {
            const yearNum = parseInt(value);
            if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
              record.case_year = yearNum;
            } else {
              warnings.push(`Invalid year format: ${value}`);
              record.case_year = null;
            }
          } else if (field === 'potential_liability_kshs' && value) {
            // Clean up currency formatting but keep as string
            record.potential_liability_kshs = value.replace(/['"]/g, '');
          } else {
            (record as any)[field] = value;
          }
        }
      });
      
      // Calculate data quality score
      const requiredFields = [
        'ag_file_reference', 'court_station', 'case_no', 'case_year',
        'case_parties', 'nature_of_claim_new', 'current_case_status'
      ];
      
      const filledRequiredFields = requiredFields.filter(field => 
        record[field as keyof GovernmentCaseImportRecord]
      );
      
      const allFields = [
        'serial_no', 'ag_file_reference', 'court_station', 'court_rank', 'case_no',
        'case_year', 'case_parties', 'nature_of_claim_old', 'nature_of_claim_new',
        'potential_liability_kshs', 'current_case_status', 'remarks', 'ministry',
        'counsel_dealing', 'region'
      ];
      
      const filledAllFields = allFields.filter(field => 
        record[field as keyof GovernmentCaseImportRecord]
      );
      
      const missingRequiredFields = requiredFields.filter(field => 
        !record[field as keyof GovernmentCaseImportRecord]
      );
      
      missingFields.push(...missingRequiredFields);
      
      record.data_quality_score = Math.round((filledAllFields.length / allFields.length) * 100);
      record.missing_fields = missingFields;
      record.import_warnings = warnings;
      
      // Skip records with no meaningful data
      if (filledRequiredFields.length === 0) {
        console.log(`Skipping row ${rowNumber}: No required fields filled`);
        return null;
      }
      
      return record;
    } catch (error) {
      console.error(`Error mapping row ${rowNumber}:`, error);
      return null;
    }
  }

  /**
   * Import records to database with progress tracking
   */
  async importRecords(
    records: GovernmentCaseImportRecord[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<GovernmentCaseImportResult> {
    const result: GovernmentCaseImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: 0
    };
    
    try {
      console.log(`Starting import of ${records.length} government case records`);
      
      // Check for existing AG file references
      const agRefs = records
        .map(r => r.ag_file_reference)
        .filter(ref => ref && ref.trim() !== '');
      
      if (agRefs.length > 0) {
        const { data: existingCases } = await supabase
          .from('government_cases')
          .select('ag_file_reference')
          .in('ag_file_reference', agRefs);
        
        if (existingCases) {
          existingCases.forEach(cas => {
            if (cas.ag_file_reference) {
              this.globalAgRefSet.add(cas.ag_file_reference);
            }
          });
        }
      }
      
      // Process in batches
      const totalBatches = Math.ceil(records.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (this.cancelled) {
          console.log('Import cancelled by user');
          break;
        }
        
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, records.length);
        const batch = records.slice(startIndex, endIndex);
        
        const batchResult = await this.processBatch(batch, startIndex);
        
        result.imported += batchResult.imported;
        result.skipped += batchResult.skipped;
        result.duplicates += batchResult.duplicates;
        result.errors.push(...batchResult.errors);
        
        const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        const message = `Processed batch ${batchIndex + 1}/${totalBatches} - Imported: ${result.imported}, Skipped: ${result.skipped}`;
        
        onProgress?.(progress, message);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      result.success = true;
      console.log('Government case import completed:', result);
      
    } catch (error) {
      console.error('Error during government case import:', error);
      result.errors.push({
        row: 0,
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    return result;
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    batch: GovernmentCaseImportRecord[],
    startIndex: number
  ): Promise<Pick<GovernmentCaseImportResult, 'imported' | 'skipped' | 'duplicates' | 'errors'>> {
    const batchResult = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: []
    };
    
    const recordsToInsert: any[] = [];
    
    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      const rowNumber = startIndex + i + 2; // +2 for header and 0-based index
      
      try {
        // Check for duplicates
        if (record.ag_file_reference && this.globalAgRefSet.has(record.ag_file_reference)) {
          batchResult.duplicates++;
          continue;
        }
        
        // Prepare record for insertion
        const insertRecord = {
          ...record,
          created_by: this.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        recordsToInsert.push(insertRecord);
        
        // Track the AG reference to prevent duplicates in this session
        if (record.ag_file_reference) {
          this.globalAgRefSet.add(record.ag_file_reference);
        }
        
      } catch (error) {
        batchResult.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        });
      }
    }
    
    // Insert valid records
    if (recordsToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('government_cases')
          .insert(recordsToInsert);
        
        if (error) {
          throw error;
        }
        
        batchResult.imported = recordsToInsert.length;
      } catch (error) {
        console.error('Batch insert error:', error);
        batchResult.errors.push({
          row: startIndex + 1,
          error: `Batch insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: recordsToInsert
        });
      }
    }
    
    return batchResult;
  }
}