#!/usr/bin/env python3
"""
Societies CSV Data Analysis Script

This script analyzes all CSV files in the societies folder to understand their structure,
identify data quality issues, and provide recommendations for robust import handling.
"""

import csv
import os
import pandas as pd
from datetime import datetime
import re
from collections import defaultdict

def analyze_csv_file(file_path, file_name):
    """Analyze a single CSV file and return detailed information"""
    print(f"\n{'='*60}")
    print(f"ANALYZING: {file_name}")
    print(f"{'='*60}")
    
    try:
        # Read with pandas for easier analysis
        df = pd.read_csv(file_path, encoding='utf-8', low_memory=False)
        
        print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"\nColumns: {list(df.columns)}")
        
        # Analyze each column
        print(f"\nCOLUMN ANALYSIS:")
        print("-" * 40)
        
        date_issues = []
        for col in df.columns:
            non_null_count = df[col].notna().sum()
            null_count = df[col].isna().sum()
            unique_count = df[col].nunique()
            
            print(f"{col}:")
            print(f"  Non-null: {non_null_count}, Null: {null_count}, Unique: {unique_count}")
            
            # Check for date-like columns
            if any(keyword in col.lower() for keyword in ['date', 'reg_date', 'registration_date', 'exemption_date']):
                print(f"  DATE COLUMN DETECTED:")
                sample_values = df[col].dropna().head(10).tolist()
                print(f"    Sample values: {sample_values}")
                
                # Check for malformed dates
                for idx, value in enumerate(df[col].dropna()):
                    if pd.notna(value):
                        date_str = str(value).strip()
                        if re.search(r'\d{4}-\d{2}-\d{2}', date_str):
                            # Check for invalid month/day combinations
                            parts = date_str.split('-')
                            if len(parts) >= 3:
                                try:
                                    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                                    if month > 12 or day > 31 or month < 1 or day < 1:
                                        date_issues.append(f"Row {idx+2}: Invalid date '{date_str}' in column '{col}'")
                                except ValueError:
                                    date_issues.append(f"Row {idx+2}: Malformed date '{date_str}' in column '{col}'")
            
            # Show sample values for first few columns
            if df[col].notna().any():
                sample = df[col].dropna().head(3).tolist()
                print(f"    Sample: {sample}")
        
        # Report date issues
        if date_issues:
            print(f"\nDATE VALIDATION ISSUES FOUND:")
            print("-" * 40)
            for issue in date_issues[:10]:  # Show first 10 issues
                print(f"  {issue}")
            if len(date_issues) > 10:
                print(f"  ... and {len(date_issues) - 10} more issues")
        
        # Missing data analysis
        print(f"\nMISSING DATA ANALYSIS:")
        print("-" * 40)
        missing_percentages = (df.isna().sum() / len(df) * 100).round(2)
        for col, pct in missing_percentages.items():
            if pct > 0:
                print(f"  {col}: {pct}% missing")
        
        return {
            'file_name': file_name,
            'shape': df.shape,
            'columns': list(df.columns),
            'date_issues': date_issues,
            'missing_percentages': missing_percentages.to_dict(),
            'sample_data': df.head(3).to_dict('records') if len(df) > 0 else []
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
    
    # Date issues summary
    if all_date_issues:
        print(f"\nDATE ISSUES REQUIRING ATTENTION:")
        print("-" * 40)
        issue_patterns = defaultdict(int)
        for issue in all_date_issues:
            # Extract pattern
            if 'Invalid date' in issue:
                pattern = "Invalid date format"
            elif 'Malformed date' in issue:
                pattern = "Malformed date"
            else:
                pattern = "Other date issue"
            issue_patterns[pattern] += 1
        
        for pattern, count in issue_patterns.items():
            print(f"  {pattern}: {count} occurrences")
        
        print(f"\nSample date issues:")
        for issue in all_date_issues[:5]:
            print(f"  {issue}")
    
    print(f"\nRECOMMENDATIONS:")
    print("-" * 40)
    print("1. Implement robust date parsing that handles invalid dates like '1954-20-20'")
    print("2. Add validation to reject impossible dates (month > 12, day > 31)")
    print("3. Use try-catch blocks for all date parsing operations")
    print("4. Log malformed data for manual review rather than failing entire import")
    print("5. Consider setting malformed dates to NULL rather than failing validation")
    print("6. Add data cleaning step before database insertion")

if __name__ == "__main__":
    main()