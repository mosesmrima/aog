#!/usr/bin/env python3
"""
Analyze all CSV files in the cases directory to understand their structure
and create a comprehensive database schema for legal affairs cases.
"""

import pandas as pd
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
    data_types = defaultdict(set)
    sample_data = {}
    
    # Analyze each file
    for i, csv_file in enumerate(csv_files, 1):
        print(f"{'='*60}")
        print(f"ANALYZING FILE {i}/{len(csv_files)}: {csv_file.name}")
        print(f"{'='*60}")
        
        try:
            # Read CSV with error handling
            df = pd.read_csv(csv_file, encoding='utf-8')
            
            # Basic info
            print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
            print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
            
            # Column analysis
            print(f"\nColumns ({len(df.columns)}):")
            for col in df.columns:
                print(f"  - {col}")
                all_columns.add(col)
                column_frequency[col] += 1
            
            # Data types
            print(f"\nData Types:")
            for col in df.columns:
                dtype = str(df[col].dtype)
                data_types[col].add(dtype)
                print(f"  {col}: {dtype}")
            
            # Sample data (first 3 rows)
            print(f"\nSample Data (first 3 rows):")
            for idx, row in df.head(3).iterrows():
                print(f"  Row {idx + 1}:")
                for col in df.columns:
                    value = row[col]
                    if pd.isna(value):
                        value = "NULL"
                    print(f"    {col}: {value}")
                print()
            
            # Missing data analysis
            print(f"Missing Data:")
            missing_counts = df.isnull().sum()
            for col in df.columns:
                missing_pct = (missing_counts[col] / len(df)) * 100
                print(f"  {col}: {missing_counts[col]} ({missing_pct:.1f}%)")
            
            # Unique values for categorical columns
            print(f"\nUnique Value Counts:")
            for col in df.columns:
                unique_count = df[col].nunique()
                print(f"  {col}: {unique_count} unique values")
                
                # Show sample unique values for categorical columns
                if unique_count <= 20 and unique_count > 1:
                    unique_values = df[col].dropna().unique()[:10]
                    print(f"    Sample values: {list(unique_values)}")
            
            # Store file analysis
            analysis_results["files"][csv_file.name] = {
                "shape": df.shape,
                "columns": list(df.columns),
                "dtypes": {col: str(df[col].dtype) for col in df.columns},
                "missing_data": {col: int(missing_counts[col]) for col in df.columns},
                "unique_counts": {col: int(df[col].nunique()) for col in df.columns}
            }
            
            # Store sample data
            sample_data[csv_file.name] = df.head(3).to_dict('records')
            
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
        dtypes = list(data_types[col])
        freq = column_frequency[col]
        print(f"  {col}:")
        print(f"    - Frequency: {freq}/{len(csv_files)} files")
        print(f"    - Data types: {dtypes}")
        print(f"    - Recommended type: {recommend_sql_type(dtypes)}")
    
    # Save analysis results
    with open('cases_analysis_results.json', 'w') as f:
        json.dump(analysis_results, f, indent=2, default=str)
    
    # Generate SQL schema
    generate_sql_schema(all_columns, data_types, column_frequency, len(csv_files))
    
    print(f"\n✓ Analysis complete! Results saved to 'cases_analysis_results.json'")
    print(f"✓ SQL schema saved to 'cases_schema.sql'")
    
    return analysis_results

def recommend_sql_type(dtypes):
    """Recommend SQL data type based on pandas dtypes."""
    if 'object' in dtypes:
        return 'TEXT'
    elif any('int' in dtype for dtype in dtypes):
        return 'INTEGER'
    elif any('float' in dtype for dtype in dtypes):
        return 'DECIMAL'
    elif any('datetime' in dtype for dtype in dtypes):
        return 'TIMESTAMP'
    else:
        return 'TEXT'

def generate_sql_schema(columns, data_types, column_frequency, total_files):
    """Generate SQL schema for the cases table."""
    
    schema_sql = """-- Legal Affairs Cases Database Schema
-- Generated from analysis of {total_files} CSV files
-- This schema accommodates all columns found across all files

CREATE TABLE IF NOT EXISTS legal_affairs_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Core case identification
""".format(total_files=total_files)
    
    # Group columns by importance/frequency
    core_columns = []
    optional_columns = []
    
    for col in sorted(columns):
        freq = column_frequency[col]
        dtypes = list(data_types[col])
        sql_type = recommend_sql_type(dtypes)
        
        # Clean column name for SQL
        clean_col = col.lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace('/', '_')
        
        if freq >= total_files * 0.5:  # Appears in 50%+ of files
            core_columns.append(f"    {clean_col} {sql_type}, -- From {freq}/{total_files} files")
        else:
            optional_columns.append(f"    {clean_col} {sql_type}, -- From {freq}/{total_files} files")
    
    # Add core columns
    if core_columns:
        schema_sql += "\n".join(core_columns)
    
    # Add optional columns
    if optional_columns:
        schema_sql += "\n    \n    -- Optional fields (less frequent)\n"
        schema_sql += "\n".join(optional_columns)
    
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