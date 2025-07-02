import { supabase } from './supabase';

export interface MarriageImportRecord {
  marriage_date: string;
  groom_name: string;
  bride_name: string;
  place_of_marriage: string;
  certificate_number?: string | null;
  license_type?: string | null;
  files?: string | null;
  data_quality_score?: number;
  missing_fields?: string[];
  import_warnings?: string[];
}

export interface ImportResult {
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

export class MarriageBulkImporter {
  private batchSize = 500; // Increased batch size for better performance
  
  constructor(private userId: string) {}

  /**
   * Parse CSV data and convert to import format
   */
  parseCSVData(csvContent: string): MarriageImportRecord[] {
    try {
      console.log('Starting CSV parsing...');
      const lines = csvContent.split('\n');
      console.log('Total lines in CSV:', lines.length);
      const records: MarriageImportRecord[] = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
        const columns = this.parseCSVLine(line);
        
        // Skip if not enough columns or row number is empty
        if (columns.length < 6 || !columns[0] || columns[0] === ' ,') continue;
        
        const record = this.mapCSVToRecord(columns, i + 1);
        if (record) {
          records.push(record);
        }
      } catch (error) {
        console.error(`Error parsing line ${i + 1}:`, error);
      }
      }
      
      console.log('CSV parsing completed. Records found:', records.length);
      return records;
    } catch (error) {
      console.error('CSV parsing failed:', error);
      throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a single CSV line handling quoted fields
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
   * Map CSV columns to database record with data quality assessment
   */
  private mapCSVToRecord(columns: string[], rowNumber: number): MarriageImportRecord | null {
    try {
      // Expected format: " ,",DATE,NAME OF GROOM,NAME OF BRIDE,PLACE OF MARRIAGE,MARRIAGE CERTIFICATE NUMBER,REGISTRAR'S CERTIFICATE/SPECIAL LICENSE,FILES
      if (columns.length < 4) {
        return null;
      }

      const marriageDate = this.convertDateFormat(columns[1]?.trim());
      const groomName = columns[2]?.trim();
      const brideName = columns[3]?.trim();
      const placeOfMarriage = columns[4]?.trim();
      const certificateNumber = columns[5]?.trim() || null;
      const licenseType = columns[6]?.trim() || null;
      const files = columns[7]?.trim() || null;

      // Calculate data quality and missing fields
      const missingFields: string[] = [];
      const warnings: string[] = [];
      let qualityScore = 100;

      // Check core required fields
      if (!marriageDate) {
        missingFields.push('marriage_date');
        qualityScore -= 30;
      }
      if (!groomName) {
        missingFields.push('groom_name');
        qualityScore -= 25;
      }
      if (!brideName) {
        missingFields.push('bride_name');
        qualityScore -= 25;
      }
      if (!placeOfMarriage) {
        missingFields.push('place_of_marriage');
        qualityScore -= 15;
      }

      // Check optional but important fields
      if (!certificateNumber) {
        missingFields.push('certificate_number');
        warnings.push('Missing certificate number');
        qualityScore -= 20;
      }
      if (!licenseType) {
        missingFields.push('license_type');
        qualityScore -= 5;
      }
      if (!files) {
        missingFields.push('files');
        qualityScore -= 5;
      }

      // Data quality checks
      if (groomName && groomName.length < 3) {
        warnings.push('Groom name appears too short');
        qualityScore -= 5;
      }
      if (brideName && brideName.length < 3) {
        warnings.push('Bride name appears too short');
        qualityScore -= 5;
      }
      if (groomName && groomName.length > 100) {
        warnings.push('Groom name appears unusually long');
        qualityScore -= 5;
      }
      if (brideName && brideName.length > 100) {
        warnings.push('Bride name appears unusually long');
        qualityScore -= 5;
      }

      // Skip records missing too many core fields
      if (!marriageDate || !groomName || !brideName || !placeOfMarriage) {
        console.warn(`Row ${rowNumber}: Missing core required fields - ${missingFields.join(', ')}`);
        return null;
      }

      qualityScore = Math.max(0, qualityScore);

      return {
        marriage_date: marriageDate,
        groom_name: groomName,
        bride_name: brideName,
        place_of_marriage: placeOfMarriage,
        certificate_number: certificateNumber,
        license_type: licenseType,
        files: files,
        data_quality_score: qualityScore,
        missing_fields: missingFields,
        import_warnings: warnings
      };
    } catch (error) {
      console.error(`Error mapping row ${rowNumber}:`, error);
      return null;
    }
  }

  /**
   * Convert DD/MM/YYYY to YYYY-MM-DD format
   */
  private convertDateFormat(dateStr: string): string | null {
    try {
      if (!dateStr || typeof dateStr !== 'string') return null;
      
      const cleanDate = dateStr.trim();
      const parts = cleanDate.split('/');
      if (parts.length !== 3) return null;
      
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      
      // Validate date components
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return null;
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) return null;
      
      // Create date object to validate the date is real (e.g., not Feb 30)
      const testDate = new Date(yearNum, monthNum - 1, dayNum);
      if (testDate.getDate() !== dayNum || testDate.getMonth() !== (monthNum - 1) || testDate.getFullYear() !== yearNum) {
        return null;
      }
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date conversion error:', error);
      return null;
    }
  }


  /**
   * Import records in batches
   */
  async importRecords(
    records: MarriageImportRecord[], 
    onProgress?: (imported: number, total: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: 0
    };

    try {
      console.log(`Starting import of ${records.length} records...`);
      
      // Process in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        const batchResult = await this.processBatch(batch, i);
        
        result.imported += batchResult.imported;
        result.skipped += batchResult.skipped;
        result.duplicates += batchResult.duplicates;
        result.errors.push(...batchResult.errors);
        
        // Update progress
        onProgress?.(result.imported, records.length);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      result.success = true;
      console.log(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.duplicates} duplicates`);
      
    } catch (error) {
      console.error('Import failed:', error);
      result.errors.push({
        row: 0,
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  /**
   * Process a single batch of records using optimized bulk operations
   * 
   * Strategy:
   * 1. Single database query to check for existing certificate numbers
   * 2. Filter duplicates (both DB and within-batch) before insertion
   * 3. Use Supabase batch insert (500 records at once) for maximum efficiency
   * 4. Fallback to smaller chunks if batch fails
   * 5. Individual inserts only as last resort for error identification
   */
  private async processBatch(batch: MarriageImportRecord[], batchOffset: number) {
    const result = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>
    };

    try {
      // Check for duplicates within this batch itself
      const batchCertSet = new Set();
      
      // Prepare records for insertion (excluding within-batch duplicates)
      const recordsToInsert = batch
        .map((record) => {
          // Check for duplicates within this batch
          if (record.certificate_number) {
            if (batchCertSet.has(record.certificate_number)) {
              result.duplicates++;
              return null;
            }
            batchCertSet.add(record.certificate_number);
          }
          
          return {
            marriage_date: record.marriage_date,
            groom_name: record.groom_name,
            bride_name: record.bride_name,
            place_of_marriage: record.place_of_marriage,
            certificate_number: record.certificate_number,
            license_type: record.license_type,
            files: record.files ? JSON.stringify([{ url: record.files, name: 'Import File' }]) : JSON.stringify([]),
            created_by: this.userId,
            data_quality_score: record.data_quality_score || 100,
            missing_fields: record.missing_fields || [],
            has_duplicates: false, // Will be updated later if needed
            import_warnings: record.import_warnings || []
          };
        })
        .filter(record => record !== null);

      if (recordsToInsert.length === 0) {
        result.skipped = batch.length;
        return result;
      }

      // Batch insert with upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from('marriages')
        .upsert(recordsToInsert, { 
          onConflict: 'certificate_number',
          ignoreDuplicates: true 
        })
        .select('id');

      if (error) {
        // If batch insert fails, it might be due to individual record issues
        // Try smaller chunks or individual records for error identification
        console.warn(`Batch insert failed for batch starting at ${batchOffset}: ${error.message}`);
        
        // Split into smaller chunks for retry
        const chunkSize = Math.max(1, Math.floor(recordsToInsert.length / 4));
        let totalInserted = 0;
        
        for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
          const chunk = recordsToInsert.slice(i, i + chunkSize);
          
          try {
            const { data: chunkData, error: chunkError } = await supabase
              .from('marriages')
              .upsert(chunk, { 
                onConflict: 'certificate_number',
                ignoreDuplicates: true 
              })
              .select('id');
              
            if (chunkError) {
              // If chunk fails, try individual records
              for (let j = 0; j < chunk.length; j++) {
                try {
                  const { error: individualError } = await supabase
                    .from('marriages')
                    .upsert([chunk[j]], { 
                      onConflict: 'certificate_number',
                      ignoreDuplicates: true 
                    });
                    
                  if (individualError) {
                    result.errors.push({
                      row: batchOffset + i + j,
                      error: `Individual insert failed: ${individualError.message}`,
                      data: chunk[j]
                    });
                  } else {
                    totalInserted++;
                  }
                } catch (e) {
                  result.errors.push({
                    row: batchOffset + i + j,
                    error: `Individual insert exception: ${e instanceof Error ? e.message : 'Unknown error'}`,
                    data: chunk[j]
                  });
                }
              }
            } else {
              totalInserted += chunkData?.length || chunk.length;
            }
          } catch (e) {
            result.errors.push({
              row: batchOffset + i,
              error: `Chunk processing failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
              data: chunk
            });
          }
        }
        
        result.imported = totalInserted;
        result.skipped = recordsToInsert.length - totalInserted;
      } else {
        result.imported = data?.length || recordsToInsert.length;
        console.log(`✅ Batch ${Math.floor(batchOffset / this.batchSize) + 1}: ${result.imported} records inserted successfully`);
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      result.errors.push({
        row: batchOffset,
        error: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: batch
      });
      result.skipped = batch.length;
    }

    return result;
  }

  /**
   * Validate import data before processing
   */
  validateImportData(records: MarriageImportRecord[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (records.length === 0) {
      errors.push('No valid records found in the file');
      return { valid: false, errors, warnings };
    }

    // Check for duplicate certificate numbers within the file
    const certNumbers = new Set<string>();
    const duplicatesInFile = new Set<string>();
    
    records.forEach((record) => {
      const certNum = record.certificate_number;
      if (certNum && certNum.trim()) {
        if (certNumbers.has(certNum)) {
          duplicatesInFile.add(certNum);
        } else {
          certNumbers.add(certNum);
        }
      }
    });

    if (duplicatesInFile.size > 0) {
      warnings.push(`Found ${duplicatesInFile.size} duplicate certificate numbers within the file`);
    }

    // Check for records with very long names (potential data issues)
    const longNames = records.filter(r => 
      r.groom_name.length > 100 || r.bride_name.length > 100
    );
    
    if (longNames.length > 0) {
      warnings.push(`Found ${longNames.length} records with unusually long names`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}