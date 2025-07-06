/**
 * Script to import government cases from CSV file
 * Usage: Run this script through the Next.js development environment or create a dedicated import endpoint
 */

import { GovernmentCaseBulkImporter } from '../lib/government-case-bulk-import';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function importGovernmentCases() {
  try {
    console.log('Starting government cases import...');
    
    // Read the CSV file
    const csvFilePath = resolve(__dirname, '../AG-ELC MATTERS.xlsx - Table 1.csv');
    console.log('Reading CSV file from:', csvFilePath);
    
    const csvContent = readFileSync(csvFilePath, 'utf-8');
    console.log('CSV file read successfully, size:', csvContent.length, 'bytes');
    
    // Create importer instance
    // Note: You'll need to provide a valid user ID for the created_by field
    const userId = 'system-import'; // This should be a valid UUID from your user_profiles table
    const importer = new GovernmentCaseBulkImporter(userId);
    
    // Parse CSV data
    console.log('Parsing CSV data...');
    const records = importer.parseCSVData(csvContent);
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Show some sample records
    console.log('Sample records:');
    records.slice(0, 3).forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        ag_file_reference: record.ag_file_reference,
        court_station: record.court_station,
        case_year: record.case_year,
        case_parties: record.case_parties?.substring(0, 50) + '...',
        data_quality_score: record.data_quality_score
      });
    });
    
    // Import records
    console.log('Starting import to database...');
    const result = await importer.importRecords(records, (progress, message) => {
      console.log(`Progress: ${progress}% - ${message}`);
    });
    
    // Show results
    console.log('\n=== Import Results ===');
    console.log('Success:', result.success);
    console.log('Imported:', result.imported);
    console.log('Skipped:', result.skipped);
    console.log('Duplicates:', result.duplicates);
    console.log('Errors:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('\nFirst 5 errors:');
      result.errors.slice(0, 5).forEach((error, index) => {
        console.log(`Error ${index + 1} (row ${error.row}):`, error.error);
      });
    }
    
    console.log('\nImport completed!');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importGovernmentCases();
}

export { importGovernmentCases };