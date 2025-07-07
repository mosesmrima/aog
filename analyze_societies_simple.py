#!/usr/bin/env python3
"""
Simple Societies CSV Data Analysis Script (no external dependencies)
"""

import csv
import os
import re
from collections import defaultdict

def analyze_csv_file(file_path, file_name):
    """Analyze a single CSV file"""
    print(f"\n{'='*60}")
    print(f"ANALYZING: {file_name}")
    print(f"{'='*60}")
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            # Use csv.Sniffer to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)
        
        if len(rows) < 2:
            print(f"ERROR: File has insufficient data")
            return None
            
        headers = rows[0]
        data_rows = rows[1:]
        
        print(f"Shape: {len(data_rows)} rows, {len(headers)} columns")
        print(f"Delimiter detected: '{delimiter}'")
        print(f"\nColumns: {headers}")
        
        # Analyze each column
        print(f"\nCOLUMN ANALYSIS:")
        print("-" * 40)
        
        date_issues = []
        column_stats = {}
        
        for col_idx, col_name in enumerate(headers):
            values = [row[col_idx] if col_idx < len(row) else '' for row in data_rows]
            non_empty = [v for v in values if v and v.strip()]
            empty_count = len(values) - len(non_empty)
            unique_values = set(non_empty)
            
            column_stats[col_name] = {
                'non_empty': len(non_empty),
                'empty': empty_count,
                'unique': len(unique_values),
                'sample': non_empty[:3] if non_empty else []
            }
            
            print(f"{col_name}:")
            print(f"  Non-empty: {len(non_empty)}, Empty: {empty_count}, Unique: {len(unique_values)}")
            
            # Check for date-like columns
            if any(keyword in col_name.lower() for keyword in ['date', 'reg_date', 'registration_date', 'exemption_date']):
                print(f"  DATE COLUMN DETECTED:")
                
                # Analyze date patterns
                for row_idx, value in enumerate(values):
                    if value and value.strip():
                        date_str = value.strip()
                        
                        # Check for malformed ISO dates (YYYY-MM-DD)
                        if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                            parts = date_str.split('-')
                            if len(parts) >= 3:
                                try:
                                    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                                    if month > 12 or day > 31 or month < 1 or day < 1:
                                        date_issues.append(f"Row {row_idx+2}: Invalid date '{date_str}' in column '{col_name}'")
                                        if len(date_issues) <= 5:  # Show first 5 examples
                                            print(f"    ISSUE: Row {row_idx+2} has invalid date '{date_str}'")
                                except ValueError:
                                    date_issues.append(f"Row {row_idx+2}: Malformed date '{date_str}' in column '{col_name}'")
                        
                        # Check for other date patterns
                        elif re.match(r'\d{1,2}/\d{1,2}/\d{2,4}', date_str):
                            print(f"    Pattern: DD/MM/YYYY or MM/DD/YYYY format detected")
                        elif re.match(r'\d{1,2}-\d{1,2}-\d{2,4}', date_str):
                            print(f"    Pattern: DD-MM-YYYY format detected")
            
            # Show sample values
            if non_empty:
                print(f"    Sample: {non_empty[:3]}")
        
        # Report date issues summary
        if date_issues:
            print(f"\nDATE VALIDATION ISSUES FOUND: {len(date_issues)} total")
            print("-" * 40)
            for issue in date_issues[:10]:  # Show first 10 issues
                print(f"  {issue}")
            if len(date_issues) > 10:
                print(f"  ... and {len(date_issues) - 10} more issues")
        
        return {
            'file_name': file_name,
            'shape': (len(data_rows), len(headers)),
            'columns': headers,
            'date_issues': date_issues,
            'column_stats': column_stats,
            'sample_data': data_rows[:3] if data_rows else []
        }
        
    except Exception as e:
        print(f"ERROR analyzing {file_name}: {str(e)}")
        return None

def main():
    """Main analysis function"""
    societies_dir = "/home/mrima/Downloads/project-bolt-sb1-jsujeazh/project/societies"
    
    print("SOCIETIES CSV DATA ANALYSIS")
    print("=" * 60)
    print(f"Analyzing files in: {societies_dir}")
    
    if not os.path.exists(societies_dir):
        print(f"ERROR: Directory {societies_dir} does not exist")
        return
    
    # Find CSV files
    csv_files = []
    for file in os.listdir(societies_dir):
        if file.endswith('.csv'):
            csv_files.append(file)
    
    print(f"Found {len(csv_files)} CSV files:")
    for file in csv_files:
        print(f"  - {file}")
    
    # Analyze each file
    all_analyses = []
    all_date_issues = []
    
    for csv_file in csv_files:
        file_path = os.path.join(societies_dir, csv_file)
        analysis = analyze_csv_file(file_path, csv_file)
        if analysis:
            all_analyses.append(analysis)
            all_date_issues.extend(analysis['date_issues'])
    
    # Summary report
    print(f"\n{'='*60}")
    print("SUMMARY REPORT")
    print(f"{'='*60}")
    
    print(f"Total files analyzed: {len(all_analyses)}")
    print(f"Total date issues found: {len(all_date_issues)}")
    
    # Column mapping analysis
    print(f"\nCOLUMN MAPPING ANALYSIS:")
    print("-" * 40)
    all_columns = set()
    for analysis in all_analyses:
        all_columns.update(analysis['columns'])
    
    print(f"Unique column names across all files ({len(all_columns)}):")
    for col in sorted(all_columns):
        print(f"  - {col}")
    
    # Date issues by pattern
    if all_date_issues:
        print(f"\nDATE ISSUES REQUIRING ATTENTION:")
        print("-" * 40)
        issue_patterns = defaultdict(int)
        invalid_date_examples = []
        
        for issue in all_date_issues:
            if 'Invalid date' in issue:
                issue_patterns["Invalid date format"] += 1
                # Extract the date for examples
                match = re.search(r"'([^']+)'", issue)
                if match:
                    invalid_date_examples.append(match.group(1))
            elif 'Malformed date' in issue:
                issue_patterns["Malformed date"] += 1
            else:
                issue_patterns["Other date issue"] += 1
        
        for pattern, count in issue_patterns.items():
            print(f"  {pattern}: {count} occurrences")
        
        if invalid_date_examples:
            print(f"\nInvalid date examples:")
            for example in set(invalid_date_examples[:10]):
                print(f"  - {example}")
    
    print(f"\nRECOMMENDATIONS FOR ROBUST IMPORT:")
    print("-" * 40)
    print("1. Implement robust date parsing that handles invalid dates like '1954-20-20'")
    print("2. Add validation to reject impossible dates (month > 12, day > 31)")
    print("3. Use try-catch blocks for all date parsing operations")
    print("4. Set malformed dates to NULL rather than failing entire import")
    print("5. Log malformed data for manual review")
    print("6. Add preprocessing to clean data before database insertion")
    print("7. Consider date format detection and normalization")

if __name__ == "__main__":
    main()