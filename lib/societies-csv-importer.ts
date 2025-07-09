import { supabase } from './supabase';

export interface SocietyRecord {
  registered_name: string | null;
  registration_date: string | null;
  registration_number: string | null;
}

export interface ImportResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
}

export interface ImportProgress {
  processed: number;
  total: number;
  percentage: number;
  currentRecord?: string;
}

export class SocietiesCSVImporter {
  private onProgress?: (progress: ImportProgress) => void;

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  async importFromCSV(file: File): Promise<ImportResult> {
    try {
      console.log('Starting CSV import for societies...');
      
      // Read file content
      const csvText = await this.readFileContent(file);
      
      // Parse CSV content
      const records = this.parseCSV(csvText);
      
      if (records.length === 0) {
        return {
          success: false,
          message: 'No valid records found in CSV file',
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          errors: ['CSV file is empty or has no valid data']
        };
      }

      // Import records to database
      const result = await this.importRecords(records);
      
      console.log('CSV import completed:', result);
      return result;
      
    } catch (error) {
      console.error('CSV import failed:', error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  private parseCSV(csvText: string): SocietyRecord[] {
    const lines = csvText.trim().split(/\r?\n/);
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Validate headers
    const expectedHeaders = ['Registered Name', 'registration_date', 'registration_number'];
    const headerMap = this.createHeaderMap(headers, expectedHeaders);
    
    if (!headerMap['Registered Name'] && !headerMap['registered_name']) {
      throw new Error('CSV must contain a "Registered Name" column');
    }

    // Parse data rows
    const records: SocietyRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = this.parseCSVLine(line);
        
        if (values.length < headers.length) {
          console.warn(`Row ${i + 1}: Not enough values, padding with empty strings`);
          while (values.length < headers.length) {
            values.push('');
          }
        }

        const record: SocietyRecord = {
          registered_name: this.cleanValue(values[headerMap['Registered Name'] || headerMap['registered_name'] || 0]),
          registration_date: this.parseDate(values[headerMap['registration_date'] || 1]),
          registration_number: this.cleanValue(values[headerMap['registration_number'] || 2])
        };

        // Only add records with at least a name
        if (record.registered_name) {
          records.push(record);
        }
        
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
        continue;
      }
    }

    return records;
  }

  private createHeaderMap(headers: string[], expectedHeaders: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      
      // Map variations of the expected headers
      if (cleanHeader.includes('registered name') || cleanHeader.includes('name')) {
        map['Registered Name'] = index;
      } else if (cleanHeader.includes('registration_date') || cleanHeader.includes('date')) {
        map['registration_date'] = index;
      } else if (cleanHeader.includes('registration_number') || cleanHeader.includes('number')) {
        map['registration_number'] = index;
      }
    });
    
    return map;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  private cleanValue(value: string): string | null {
    if (!value || value.trim() === '') {
      return null;
    }
    
    // Remove quotes and clean up
    let cleaned = value.replace(/^["']|["']$/g, '').trim();
    
    // Return null for empty values
    if (!cleaned || cleaned === 'NULL' || cleaned === 'null') {
      return null;
    }
    
    return cleaned;
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    const cleaned = this.cleanValue(dateStr);
    if (!cleaned) return null;
    
    try {
      // Try to parse the date
      const date = new Date(cleaned);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Return in ISO format (YYYY-MM-DD)
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date parsing failed:', cleaned, error);
      return null;
    }
  }

  private async importRecords(records: SocietyRecord[]): Promise<ImportResult> {
    const batchSize = 100;
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];

    // Process records in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Update progress
      if (this.onProgress) {
        this.onProgress({
          processed: i,
          total: records.length,
          percentage: Math.round((i / records.length) * 100),
          currentRecord: batch[0]?.registered_name || 'Processing...'
        });
      }

      try {
        // Insert batch
        const { data, error } = await supabase
          .from('societies')
          .insert(batch);

        if (error) {
          console.error('Batch insert error:', error);
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          failedRecords += batch.length;
        } else {
          successfulRecords += batch.length;
        }
        
      } catch (error) {
        console.error('Batch processing error:', error);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedRecords += batch.length;
      }
    }

    // Final progress update
    if (this.onProgress) {
      this.onProgress({
        processed: records.length,
        total: records.length,
        percentage: 100,
        currentRecord: 'Complete'
      });
    }

    const success = successfulRecords > 0;
    const message = success 
      ? `Successfully imported ${successfulRecords} records${failedRecords > 0 ? ` (${failedRecords} failed)` : ''}`
      : 'Import failed - no records were imported';

    return {
      success,
      message,
      totalRecords: records.length,
      successfulRecords,
      failedRecords,
      errors
    };
  }

  // Helper method to validate CSV file before import
  static validateCSVFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return {
        valid: false,
        error: 'Please select a CSV file'
      };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { valid: true };
  }
}