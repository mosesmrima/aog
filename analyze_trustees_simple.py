#!/usr/bin/env python3
"""
Simple analysis of Public Trustees CSV files without external dependencies
"""

import csv
import os
import json
from collections import defaultdict, Counter
import re

def analyze_csv_file(file_path):
    """Analyze a single CSV file and return structure information"""
    try:
        # Try different encodings
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    # Read first few lines to get structure
                    sample_lines = []
                    reader = csv.reader(f)
                    
                    # Get headers
                    headers = next(reader)
                    
                    # Get sample data (first 5 rows)
                    sample_data = []
                    for i, row in enumerate(reader):
                        if i >= 5:
                            break
                        sample_data.append(row)
                    
                    # Count total rows by reading the whole file
                    f.seek(0)
                    total_rows = sum(1 for _ in reader) - 1  # -1 for header
                    
                    return {
                        'file_path': file_path,
                        'file_name': os.path.basename(file_path),
                        'total_rows': total_rows,
                        'total_columns': len(headers),
                        'columns': headers,
                        'sample_data': sample_data,
                        'encoding_used': encoding
                    }
                    
            except UnicodeDecodeError:
                continue
        
        return {
            'file_path': file_path,
            'error': 'Could not decode file with any encoding'
        }
        
    except Exception as e:
        return {
            'file_path': file_path,
            'error': str(e)
        }

def identify_common_fields(all_files_info):
    """Identify common field patterns across all files"""
    column_patterns = defaultdict(list)
    
    for file_info in all_files_info:
        if 'error' in file_info:
            continue
            
        for col in file_info['columns']:
            # Normalize column names for pattern matching
            normalized = col.lower().strip().replace(' ', '_').replace('-', '_').replace('.', '_')
            column_patterns[normalized].append({
                'original': col,
                'file': file_info['file_name'],
                'sample_data': file_info['sample_data']
            })
    
    return column_patterns

def suggest_schema_fields(column_patterns):
    """Suggest database schema fields based on common patterns"""
    schema_suggestions = {}
    
    # Look for common trustee-related fields
    field_mappings = {
        'pt_cause_no': ['pt_cause_no', 'cause_no', 'pt_no', 'case_no', 'file_no', 'pt_cause_number'],
        'folio_no': ['folio_no', 'folio', 'folio_number', 'folio_number_'],
        'deceased_name': ['deceased_name', 'name_of_deceased', 'deceased', 'name', 'name_of_the_deceased'],
        'station': ['station', 'court_station', 'location', 'court'],
        'date_of_death': ['date_of_death', 'death_date', 'deceased_date', 'date_death'],
        'estate_value': ['estate_value', 'value', 'amount', 'estate_amount'],
        'administrator': ['administrator', 'admin', 'trustee', 'public_trustee'],
        'year': ['year', 'file_year'],
        'status': ['status', 'case_status'],
        'remarks': ['remarks', 'comments', 'notes', 'comment']
    }
    
    for schema_field, possible_names in field_mappings.items():
        matches = []
        for possible_name in possible_names:
            if possible_name in column_patterns:
                matches.extend(column_patterns[possible_name])
        
        if matches:
            schema_suggestions[schema_field] = {
                'matches': matches,
                'confidence': len(matches),
                'sample_files': list(set([m['file'] for m in matches]))
            }
    
    return schema_suggestions

def main():
    """Main analysis function"""
    trustees_dir = '/home/mrima/Downloads/project-bolt-sb1-jsujeazh/project/public_trusties'
    
    if not os.path.exists(trustees_dir):
        print(f"Directory {trustees_dir} not found!")
        return
    
    print("🔍 Analyzing Public Trustees CSV files...")
    print("=" * 60)
    
    # Get all CSV files
    csv_files = [f for f in os.listdir(trustees_dir) if f.endswith('.csv')]
    print(f"Found {len(csv_files)} CSV files to analyze")
    
    all_files_info = []
    
    # Analyze each file
    for i, filename in enumerate(csv_files, 1):
        file_path = os.path.join(trustees_dir, filename)
        print(f"({i}/{len(csv_files)}) Analyzing {filename}...")
        
        file_info = analyze_csv_file(file_path)
        all_files_info.append(file_info)
        
        if file_info and 'error' not in file_info:
            print(f"  ✓ {file_info['total_rows']} rows, {file_info['total_columns']} columns")
            print(f"  ✓ Columns: {', '.join(file_info['columns'][:5])}{'...' if len(file_info['columns']) > 5 else ''}")
        else:
            print(f"  ✗ Error: {file_info.get('error', 'Unknown error')}")
    
    print("\n" + "=" * 60)
    
    # Identify common patterns
    column_patterns = identify_common_fields(all_files_info)
    schema_suggestions = suggest_schema_fields(column_patterns)
    
    # Generate summary report
    print("📊 ANALYSIS SUMMARY")
    print("=" * 60)
    
    successful_files = [f for f in all_files_info if 'error' not in f]
    failed_files = [f for f in all_files_info if 'error' in f]
    
    print(f"✅ Successfully analyzed: {len(successful_files)} files")
    print(f"❌ Failed to analyze: {len(failed_files)} files")
    
    if failed_files:
        print("\nFailed files:")
        for f in failed_files:
            print(f"  - {os.path.basename(f['file_path'])}: {f['error']}")
    
    # Total records
    total_records = sum(f['total_rows'] for f in successful_files)
    print(f"\n📈 Total records across all files: {total_records:,}")
    
    # Year distribution
    year_files = defaultdict(list)
    for f in successful_files:
        # Extract year from filename
        year_match = re.search(r'(\d{4})', f['file_name'])
        if year_match:
            year = year_match.group(1)
            year_files[year].append(f['file_name'])
    
    print(f"\n📅 Year distribution: {len(year_files)} different years")
    for year in sorted(year_files.keys()):
        print(f"  {year}: {len(year_files[year])} file(s), {sum(f['total_rows'] for f in successful_files if year in f['file_name'])} records")
    
    # Column analysis
    print(f"\n🔍 COLUMN ANALYSIS")
    print("=" * 60)
    
    # Most common columns
    all_columns = []
    for f in successful_files:
        all_columns.extend(f['columns'])
    
    column_frequency = Counter(all_columns)
    print("Most common column names:")
    for col, count in column_frequency.most_common(15):
        print(f"  '{col}': appears in {count} files")
    
    # Schema suggestions
    print(f"\n🗄️  SUGGESTED DATABASE SCHEMA")
    print("=" * 60)
    
    for field, suggestion in schema_suggestions.items():
        print(f"\n{field.upper()}:")
        print(f"  Confidence: {suggestion['confidence']} matches")
        print(f"  Found in: {', '.join(suggestion['sample_files'][:3])}{'...' if len(suggestion['sample_files']) > 3 else ''}")
        print(f"  Column variations: {', '.join(set([m['original'] for m in suggestion['matches'][:5]]))}")
    
    # Sample data analysis
    print(f"\n📋 SAMPLE DATA ANALYSIS")
    print("=" * 60)
    
    for field, suggestion in schema_suggestions.items():
        if suggestion['matches']:
            print(f"\n{field.upper()} sample data:")
            for match in suggestion['matches'][:3]:  # Show first 3 matches
                if match['sample_data']:
                    col_index = None
                    file_info = next((f for f in successful_files if f['file_name'] == match['file']), None)
                    if file_info:
                        try:
                            col_index = file_info['columns'].index(match['original'])
                            sample_values = []
                            for row in file_info['sample_data']:
                                if col_index < len(row) and row[col_index].strip():
                                    sample_values.append(row[col_index].strip())
                            if sample_values:
                                print(f"  {match['file']} ({match['original']}): {', '.join(sample_values[:3])}")
                        except ValueError:
                            continue
    
    # Save detailed results
    results = {
        'summary': {
            'total_files': len(csv_files),
            'successful_files': len(successful_files),
            'failed_files': len(failed_files),
            'total_records': total_records,
            'year_distribution': dict(year_files)
        },
        'files_analysis': all_files_info,
        'column_patterns': dict(column_patterns),
        'schema_suggestions': schema_suggestions
    }
    
    with open('trustees_analysis_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 Detailed results saved to: trustees_analysis_results.json")
    print(f"📋 Ready to create flexible schema and import system!")

if __name__ == "__main__":
    main()