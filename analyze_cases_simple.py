#!/usr/bin/env python3
"""
Simple CSV analysis script without external dependencies.
Analyzes legal affairs case CSV files to understand structure.
"""

import csv
import os
from pathlib import Path
import json
from collections import defaultdict, Counter

def analyze_csv_files(cases_dir):
    """Analyze all CSV files in the cases directory."""
    
    print("=== LEGAL AFFAIRS CASES DATA ANALYSIS ===\n")
    
    # Get all CSV files
    csv_files = list(Path(cases_dir).glob("*.csv"))
    print(f"Found {len(csv_files)} CSV files to analyze:\n")
    
    for file in csv_files:
        print(f"  - {file.name}")
    print()
    
    # Store analysis results
    analysis_results = {
        "files": {},
        "unified_schema": {},
        "data_insights": {}
    }
    
    all_columns = set()
    column_frequency = Counter()
    sample_data = {}
    
    # Analyze each file
    for i, csv_file in enumerate(csv_files, 1):
        print(f"{'='*60}")
        print(f"ANALYZING FILE {i}/{len(csv_files)}: {csv_file.name}")
        print(f"{'='*60}")
        
        try:
            with open(csv_file, 'r', encoding='utf-8', errors='ignore') as f:
                # Try to detect delimiter
                sample = f.read(1024)
                f.seek(0)
                
                # Use csv.Sniffer to detect delimiter
                sniffer = csv.Sniffer()
                try:
                    dialect = sniffer.sniff(sample)
                    delimiter = dialect.delimiter
                except:
                    delimiter = ','
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                # Get headers
                headers = reader.fieldnames
                if not headers:
                    print(f"❌ No headers found in {csv_file.name}")
                    continue
                
                print(f"Shape: ? rows × {len(headers)} columns")
                print(f"Delimiter: '{delimiter}'")
                
                # Column analysis
                print(f"\nColumns ({len(headers)}):")
                for col in headers:
                    print(f"  - {col}")
                    all_columns.add(col)
                    column_frequency[col] += 1
                
                # Read sample data
                sample_rows = []
                row_count = 0
                
                for row in reader:
                    row_count += 1
                    if len(sample_rows) < 5:  # Get first 5 rows
                        sample_rows.append(row)
                
                print(f"\nActual rows: {row_count}")
                
                # Show sample data
                print(f"\nSample Data (first {min(3, len(sample_rows))} rows):")
                for idx, row in enumerate(sample_rows[:3]):
                    print(f"  Row {idx + 1}:")
                    for col in headers:
                        value = row.get(col, '')
                        if not value or value.strip() == '':
                            value = "NULL"
                        # Truncate long values
                        if len(str(value)) > 100:
                            value = str(value)[:100] + "..."
                        print(f"    {col}: {value}")
                    print()
                
                # Analyze data patterns
                print(f"Data Analysis:")
                for col in headers:
                    non_empty_count = sum(1 for row in sample_rows if row.get(col, '').strip())
                    total_sample = len(sample_rows)
                    if total_sample > 0:
                        fill_rate = (non_empty_count / total_sample) * 100
                        print(f"  {col}: {non_empty_count}/{total_sample} filled ({fill_rate:.1f}%)")
                
                # Store file analysis
                analysis_results["files"][csv_file.name] = {
                    "row_count": row_count,
                    "columns": headers,
                    "delimiter": delimiter,
                    "sample_data": sample_rows[:3]
                }
                
                sample_data[csv_file.name] = sample_rows[:3]
                
                print(f"\n✓ Analysis complete for {csv_file.name}")
                
        except Exception as e:
            print(f"❌ Error analyzing {csv_file.name}: {str(e)}")
            analysis_results["files"][csv_file.name] = {"error": str(e)}
        
        print()
    
    # Unified schema analysis
    print(f"{'='*60}")
    print("UNIFIED SCHEMA ANALYSIS")
    print(f"{'='*60}")
    
    print(f"Total unique columns found: {len(all_columns)}")
    print(f"\nColumn frequency across files:")
    for col, freq in column_frequency.most_common():
        print(f"  {col}: appears in {freq}/{len(csv_files)} files")
    
    print(f"\nRecommended unified schema:")
    for col in sorted(all_columns):
        freq = column_frequency[col]
        sql_type = recommend_sql_type(col)
        print(f"  {col}:")
        print(f"    - Frequency: {freq}/{len(csv_files)} files")
        print(f"    - Recommended type: {sql_type}")
    
    # Save analysis results
    with open('cases_analysis_results.json', 'w') as f:
        json.dump(analysis_results, f, indent=2, default=str)
    
    # Generate SQL schema
    generate_sql_schema(all_columns, column_frequency, len(csv_files))
    
    print(f"\n✓ Analysis complete! Results saved to 'cases_analysis_results.json'")
    print(f"✓ SQL schema saved to 'cases_schema.sql'")
    
    return analysis_results

def recommend_sql_type(column_name):
    """Recommend SQL data type based on column name patterns."""
    col_lower = column_name.lower()
    
    if 'date' in col_lower or 'time' in col_lower:
        return 'TIMESTAMP'
    elif 'id' in col_lower or 'serial' in col_lower or 'no' in col_lower:
        return 'TEXT'  # Could be alphanumeric
    elif 'amount' in col_lower or 'cost' in col_lower or 'fee' in col_lower:
        return 'DECIMAL'
    elif 'year' in col_lower:
        return 'INTEGER'
    elif 'phone' in col_lower or 'tel' in col_lower:
        return 'TEXT'
    elif 'email' in col_lower:
        return 'TEXT'
    else:
        return 'TEXT'

def generate_sql_schema(columns, column_frequency, total_files):
    """Generate SQL schema for the cases table."""
    
    schema_sql = f"""-- Legal Affairs Cases Database Schema
-- Generated from analysis of {total_files} CSV files
-- This schema accommodates all columns found across all files

CREATE TABLE IF NOT EXISTS legal_affairs_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Core case identification and data
"""
    
    # Add all columns found
    for col in sorted(columns):
        freq = column_frequency[col]
        sql_type = recommend_sql_type(col)
        
        # Clean column name for SQL
        clean_col = col.lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace('/', '_').replace('.', '_')
        
        schema_sql += f"    {clean_col} {sql_type}, -- From {freq}/{total_files} files: '{col}'\n"
    
    # Add metadata and indexes
    schema_sql += """
    -- Metadata
    file_source TEXT, -- Original CSV file name
    import_batch_id UUID, -- Batch import tracking
    data_quality_score INTEGER DEFAULT 0, -- 0-100 quality score
    
    -- Audit fields
    last_modified_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_created_at ON legal_affairs_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_file_source ON legal_affairs_cases(file_source);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_import_batch ON legal_affairs_cases(import_batch_id);

-- Enable Row Level Security
ALTER TABLE legal_affairs_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read
CREATE POLICY "legal_affairs_cases_read_policy" ON legal_affairs_cases
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policy: Authenticated users can insert
CREATE POLICY "legal_affairs_cases_insert_policy" ON legal_affairs_cases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Users can update their own records or admins can update all
CREATE POLICY "legal_affairs_cases_update_policy" ON legal_affairs_cases
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legal_affairs_cases_updated_at
    BEFORE UPDATE ON legal_affairs_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""
    
    # Save schema to file
    with open('cases_schema.sql', 'w') as f:
        f.write(schema_sql)
    
    print("SQL schema generated successfully!")

if __name__ == "__main__":
    cases_directory = "/home/mrima/Downloads/project-bolt-sb1-jsujeazh/project/cases"
    
    if not os.path.exists(cases_directory):
        print(f"❌ Cases directory not found: {cases_directory}")
        exit(1)
    
    # Run the analysis
    results = analyze_csv_files(cases_directory)
    
    print(f"\n{'='*60}")
    print("SUMMARY RECOMMENDATIONS")
    print(f"{'='*60}")
    print("1. Create unified 'legal_affairs_cases' table with all columns")
    print("2. Implement robust CSV import with data validation")
    print("3. Add data quality scoring for imported records")
    print("4. Create advanced search and filtering interface")
    print("5. Build comprehensive analytics dashboard")
    print("6. Add batch import tracking and audit logging")
    print("\nNext steps: Review generated schema and implement in Supabase!")