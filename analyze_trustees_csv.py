#!/usr/bin/env python3
"""
Public Trustees CSV Analysis Script

This script analyzes all 57 CSV files in the public_trustees directory to:
1. Understand field structures and variations
2. Create intelligent column mappings
3. Analyze date formats and patterns
4. Generate comprehensive field mapping for robust import

Author: Claude Code Assistant
"""

import os
import csv
import json
import re
from collections import defaultdict, Counter
from datetime import datetime
import pandas as pd
from typing import Dict, List, Set, Tuple, Optional, Any
import unicodedata

class TrusteesCSVAnalyzer:
    def __init__(self, csv_directory: str):
        self.csv_directory = csv_directory
        self.files_analyzed = 0
        self.total_records = 0
        self.field_variations = defaultdict(set)
        self.date_patterns = defaultdict(list)
        self.field_mappings = {}
        self.data_quality_stats = {}
        self.sample_data = defaultdict(list)
        self.file_structures = {}
        
        # Standard field categories for mapping
        self.standard_fields = {
            'pt_cause_no': ['pt cause no', 'pt_cause_no', 'cause no', 'cause_no', 'pt no', 'pt_no', 'pt cause no (station)', 'pt_cause_no_(station)', 'pt_cause_no_station'],
            'folio_no': ['folio no', 'folio_no', 'folio', 'folio number', 'folio_number'],
            'deceased_name': ['name of the deceased', 'name of deceased', 'deceased name', 'deceased_name', 'name', 'deceased'],
            'gender': ['gender', 'sex'],
            'marital_status': ['marital status', 'marital_status', 'status'],
            'date_of_death': ['date of death', 'date_of_death', 'death date', 'death_date', 'died'],
            'religion': ['religion', 'faith'],
            'county': ['county', 'location', 'district'],
            'station': ['station', 'court station', 'court_station', 'office'],
            'assets': ['assets', 'estate', 'property', 'shares', 'estate value', 'estate_value', 'value'],
            'beneficiaries': ['beneficiaries', 'beneficiary', 'heirs', 'next of kin', 'next_of_kin', 'beneficiaries/ date of birth/ id no.', 'beneficiaries/date of birth/idno'],
            'telephone_no': ['telephone no', 'telephone_no', 'phone', 'tel', 'telephone', 'contact', 'telephone no of the beneficiary', 'telephone of beneficiary'],
            'date_of_advertisement': ['date of advertisement', 'date_of_advertisement', 'advertisement date', 'advert date', 'advert_date', 'date of advertisement for claims', 'date advertisement for claims'],
            'date_of_confirmation': ['date of confirmation', 'date_of_confirmation', 'confirmation date', 'confirmed', 'date of confirmation of grants', 'date of confirmation of grants'],
            'date_account_drawn': ['date account drawn', 'date_account_drawn', 'account drawn', 'account_drawn'],
            'date_payment_made': ['date payment made', 'date_payment_made', 'payment date', 'payment_date', 'paid'],
            'file_year': ['year', 'file year', 'file_year'],
            'serial_number': ['serial number', 'serial_number', 's/no', 'sno', 'no']
        }
        
        # Date format patterns to detect
        self.date_formats = [
            r'^\d{1,2}/\d{1,2}/\d{2,4}$',  # DD/MM/YYYY, D/M/YY, etc.
            r'^\d{1,2}-\d{1,2}-\d{2,4}$',  # DD-MM-YYYY, D-M-YY, etc.
            r'^\d{1,2}\.\d{1,2}\.\d{2,4}$',  # DD.MM.YYYY, D.M.YY, etc.
            r'^\d{4}-\d{2}-\d{2}',  # ISO format YYYY-MM-DD
            r'^\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4}',  # Mon Nov 06 2000
            r'^\d{1,2}\s+\w{3}\s+\d{4}',  # 06 Nov 2000
            r'^\w{3}\s+\d{1,2},?\s+\d{4}',  # Nov 06, 2000
            r'^\d{1,2}/\d{1,2}/$',  # Incomplete dates like 25/6/
            r'^/$',  # Just /
            r'^\d{1,2}/\d{1,2}/\d{2}/\d{2}$',  # Malformed like 4/4/24/23
        ]

    def normalize_text(self, text: str) -> str:
        """Normalize text for better comparison"""
        if not text or pd.isna(text):
            return ''
        
        # Convert to string and normalize unicode
        text = str(text).strip()
        text = unicodedata.normalize('NFKD', text)
        
        # Remove extra spaces and convert to lowercase
        text = ' '.join(text.split()).lower()
        
        return text

    def detect_date_format(self, value: str) -> Optional[str]:
        """Detect the date format of a given value"""
        if not value or pd.isna(value):
            return None
            
        value = str(value).strip()
        if not value:
            return None
            
        for i, pattern in enumerate(self.date_formats):
            if re.match(pattern, value):
                return f'format_{i}_{pattern}'
        
        return 'unknown_format'

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a single CSV file"""
        file_info = {
            'file_name': os.path.basename(file_path),
            'headers': [],
            'normalized_headers': [],
            'total_rows': 0,
            'non_empty_rows': 0,
            'field_samples': defaultdict(list),
            'date_fields': defaultdict(list),
            'field_completion': defaultdict(int),
            'unique_values': defaultdict(set),
            'errors': []
        }
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                    break
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    file_info['errors'].append(f'Encoding {encoding}: {str(e)}')
                    continue
            
            if df is None:
                file_info['errors'].append('Could not read file with any encoding')
                return file_info
            
            # Basic file info
            file_info['headers'] = df.columns.tolist()
            file_info['normalized_headers'] = [self.normalize_text(h) for h in df.columns]
            file_info['total_rows'] = len(df)
            
            # Analyze each column
            for col_idx, header in enumerate(df.columns):
                normalized_header = self.normalize_text(header)
                
                # Skip empty headers
                if not normalized_header:
                    continue
                
                # Get non-null values
                non_null_values = df[header].dropna()
                file_info['field_completion'][normalized_header] = len(non_null_values)
                
                # Sample some values
                sample_values = non_null_values.head(10).tolist()
                file_info['field_samples'][normalized_header] = [str(v) for v in sample_values if str(v).strip()]
                
                # Collect unique values for small sets
                unique_vals = non_null_values.unique()
                if len(unique_vals) <= 50:  # Only for categorical-like fields
                    file_info['unique_values'][normalized_header] = set(str(v) for v in unique_vals if str(v).strip())
                
                # Check for date-like fields
                date_samples = []
                for val in sample_values:
                    if val and str(val).strip():
                        date_format = self.detect_date_format(str(val))
                        if date_format and date_format != 'unknown_format':
                            date_samples.append({
                                'value': str(val),
                                'format': date_format
                            })
                
                if date_samples:
                    file_info['date_fields'][normalized_header] = date_samples
                
                # Add to global field variations
                self.field_variations[normalized_header].add(file_info['file_name'])
            
            # Count non-empty rows
            file_info['non_empty_rows'] = len(df.dropna(how='all'))
            
        except Exception as e:
            file_info['errors'].append(f'General error: {str(e)}')
        
        return file_info

    def create_field_mapping(self) -> Dict[str, List[str]]:
        """Create intelligent field mapping based on analysis"""
        mapping = {}
        
        # Get all field variations found
        all_fields = set(self.field_variations.keys())
        
        for standard_field, known_variations in self.standard_fields.items():
            mapping[standard_field] = []
            
            # Add exact matches
            for field in all_fields:
                if field in [self.normalize_text(v) for v in known_variations]:
                    mapping[standard_field].append(field)
            
            # Add fuzzy matches
            for field in all_fields:
                if field not in mapping[standard_field]:
                    # Check for partial matches
                    for variation in known_variations:
                        normalized_variation = self.normalize_text(variation)
                        if (normalized_variation in field or 
                            field in normalized_variation or
                            self.fuzzy_match(field, normalized_variation)):
                            mapping[standard_field].append(field)
                            break
        
        return mapping

    def fuzzy_match(self, field1: str, field2: str, threshold: float = 0.7) -> bool:
        """Simple fuzzy matching for field names"""
        if not field1 or not field2:
            return False
            
        # Remove common words
        stop_words = {'of', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by'}
        
        words1 = set(field1.split()) - stop_words
        words2 = set(field2.split()) - stop_words
        
        if not words1 or not words2:
            return False
        
        # Calculate word overlap
        common_words = words1.intersection(words2)
        total_words = words1.union(words2)
        
        similarity = len(common_words) / len(total_words) if total_words else 0
        
        return similarity >= threshold

    def analyze_date_patterns(self) -> Dict[str, Any]:
        """Analyze all date patterns found across files"""
        date_analysis = {
            'formats_found': defaultdict(int),
            'problematic_dates': [],
            'date_fields_by_type': defaultdict(list),
            'parsing_rules': []
        }
        
        # Process all date samples
        for file_info in self.file_structures.values():
            for field_name, date_samples in file_info['date_fields'].items():
                for sample in date_samples:
                    date_analysis['formats_found'][sample['format']] += 1
                    
                    # Categorize by likely field type
                    if 'death' in field_name:
                        date_analysis['date_fields_by_type']['death_dates'].append(sample)
                    elif 'advertisement' in field_name:
                        date_analysis['date_fields_by_type']['advertisement_dates'].append(sample)
                    elif 'confirmation' in field_name:
                        date_analysis['date_fields_by_type']['confirmation_dates'].append(sample)
                    elif 'payment' in field_name:
                        date_analysis['date_fields_by_type']['payment_dates'].append(sample)
                    elif 'account' in field_name:
                        date_analysis['date_fields_by_type']['account_dates'].append(sample)
                    else:
                        date_analysis['date_fields_by_type']['other_dates'].append(sample)
        
        # Generate parsing rules
        date_analysis['parsing_rules'] = [
            "Store all dates as TEXT in database - no client-side parsing",
            "Handle DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY formats",
            "Handle ISO YYYY-MM-DD format",
            "Handle JavaScript Date.toString() format",
            "Handle incomplete dates (DD/MM/, /)",
            "Handle malformed dates (DD/MM/YY/YY)",
            "Skip invalid dates, store as original text",
            "Use server-side parsing only when displaying/filtering"
        ]
        
        return date_analysis

    def generate_schema_recommendations(self) -> Dict[str, Any]:
        """Generate database schema recommendations"""
        recommendations = {
            'database_schema': {},
            'field_constraints': {},
            'indexing_recommendations': [],
            'rls_policy_suggestions': []
        }
        
        # Generate schema for each standard field
        for standard_field, variations in self.create_field_mapping().items():
            if variations:  # Only include fields that were found
                if 'date' in standard_field:
                    recommendations['database_schema'][standard_field] = 'TEXT'  # Store dates as text
                elif standard_field in ['file_year', 'serial_number']:
                    recommendations['database_schema'][standard_field] = 'INTEGER'
                elif standard_field in ['data_quality_score']:
                    recommendations['database_schema'][standard_field] = 'DECIMAL(5,2)'
                elif standard_field in ['missing_fields', 'import_warnings']:
                    recommendations['database_schema'][standard_field] = 'JSONB'
                else:
                    recommendations['database_schema'][standard_field] = 'TEXT'
        
        # Field constraints
        recommendations['field_constraints'] = {
            'pt_cause_no': 'UNIQUE NOT NULL',
            'deceased_name': 'NOT NULL',
            'created_by': 'NOT NULL REFERENCES auth.users(id)',
            'created_at': 'DEFAULT NOW()',
            'updated_at': 'DEFAULT NOW()'
        }
        
        # Indexing recommendations
        recommendations['indexing_recommendations'] = [
            'CREATE INDEX idx_public_trustees_pt_cause_no ON public_trustees(pt_cause_no)',
            'CREATE INDEX idx_public_trustees_deceased_name ON public_trustees(deceased_name)',
            'CREATE INDEX idx_public_trustees_county ON public_trustees(county)',
            'CREATE INDEX idx_public_trustees_file_year ON public_trustees(file_year)',
            'CREATE INDEX idx_public_trustees_gender ON public_trustees(gender)',
            'CREATE INDEX idx_public_trustees_created_by ON public_trustees(created_by)'
        ]
        
        return recommendations

    def run_analysis(self) -> Dict[str, Any]:
        """Run comprehensive analysis on all CSV files"""
        print(f"Starting analysis of CSV files in: {self.csv_directory}")
        
        # Get all CSV files
        csv_files = [f for f in os.listdir(self.csv_directory) if f.lower().endswith('.csv')]
        print(f"Found {len(csv_files)} CSV files to analyze")
        
        # Analyze each file
        for file_name in csv_files:
            file_path = os.path.join(self.csv_directory, file_name)
            print(f"Analyzing: {file_name}")
            
            try:
                file_info = self.analyze_file(file_path)
                self.file_structures[file_name] = file_info
                self.files_analyzed += 1
                self.total_records += file_info['total_rows']
                
                if file_info['errors']:
                    print(f"  ⚠️  Errors in {file_name}: {file_info['errors']}")
                else:
                    print(f"  ✓ Analyzed {file_info['total_rows']} rows, {len(file_info['headers'])} columns")
                    
            except Exception as e:
                print(f"  ❌ Failed to analyze {file_name}: {str(e)}")
        
        # Generate comprehensive results
        results = {
            'summary': {
                'files_analyzed': self.files_analyzed,
                'total_records': self.total_records,
                'unique_field_names': len(self.field_variations),
                'analysis_date': datetime.now().isoformat()
            },
            'field_mapping': self.create_field_mapping(),
            'date_analysis': self.analyze_date_patterns(),
            'schema_recommendations': self.generate_schema_recommendations(),
            'file_structures': self.file_structures,
            'field_variations': {k: list(v) for k, v in self.field_variations.items()},
            'data_quality_insights': self.analyze_data_quality()
        }
        
        return results

    def analyze_data_quality(self) -> Dict[str, Any]:
        """Analyze data quality across all files"""
        quality_analysis = {
            'completeness_by_field': defaultdict(list),
            'common_issues': [],
            'recommendations': []
        }
        
        # Analyze field completeness
        for file_name, file_info in self.file_structures.items():
            for field_name, completion_count in file_info['field_completion'].items():
                total_rows = file_info['non_empty_rows']
                if total_rows > 0:
                    completeness_percent = (completion_count / total_rows) * 100
                    quality_analysis['completeness_by_field'][field_name].append({
                        'file': file_name,
                        'completeness': completeness_percent,
                        'filled_records': completion_count,
                        'total_records': total_rows
                    })
        
        # Common issues
        quality_analysis['common_issues'] = [
            "Many records have empty or missing key fields",
            "Date formats vary significantly across files",
            "Some files have additional empty columns",
            "PT Cause No field varies in naming convention",
            "Beneficiary information is often lengthy and unstructured"
        ]
        
        # Recommendations
        quality_analysis['recommendations'] = [
            "Implement fuzzy matching for duplicate detection",
            "Use generated IDs for records without PT Cause No",
            "Store all dates as TEXT initially, parse on display",
            "Implement data quality scoring based on field completeness",
            "Add data cleaning rules for common inconsistencies",
            "Create import validation rules that are permissive but log issues"
        ]
        
        return quality_analysis

    def save_results(self, results: Dict[str, Any], output_file: str = 'trustees_analysis_results.json'):
        """Save analysis results to JSON file"""
        # Convert sets to lists for JSON serialization
        def convert_sets(obj):
            if isinstance(obj, set):
                return list(obj)
            elif isinstance(obj, dict):
                return {k: convert_sets(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_sets(item) for item in obj]
            return obj
        
        results_serializable = convert_sets(results)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results_serializable, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n📊 Analysis results saved to: {output_file}")
        
        # Print summary
        print("\n" + "="*80)
        print("ANALYSIS SUMMARY")
        print("="*80)
        print(f"Files analyzed: {results['summary']['files_analyzed']}")
        print(f"Total records: {results['summary']['total_records']:,}")
        print(f"Unique field names: {results['summary']['unique_field_names']}")
        
        print(f"\nField mapping coverage:")
        for standard_field, variations in results['field_mapping'].items():
            if variations:
                print(f"  {standard_field}: {len(variations)} variations found")
        
        print(f"\nDate formats found:")
        for format_type, count in results['date_analysis']['formats_found'].items():
            if count > 0:
                print(f"  {format_type}: {count} occurrences")
        
        print(f"\nRecommended database schema:")
        for field, data_type in results['schema_recommendations']['database_schema'].items():
            print(f"  {field}: {data_type}")

def main():
    """Main function to run the analysis"""
    csv_directory = '/home/mrima/Downloads/project-bolt-sb1-jsujeazh/project/public_trusties'
    
    if not os.path.exists(csv_directory):
        print(f"❌ Directory not found: {csv_directory}")
        return
    
    analyzer = TrusteesCSVAnalyzer(csv_directory)
    results = analyzer.run_analysis()
    analyzer.save_results(results)
    
    print("\n🎉 Analysis complete!")
    print("\nNext steps:")
    print("1. Review the generated field mappings")
    print("2. Update the TypeScript CSV importer with the new mappings")
    print("3. Implement the recommended schema changes")
    print("4. Test import with the new permissive approach")

if __name__ == "__main__":
    main()