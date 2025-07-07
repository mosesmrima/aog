-- Legal Affairs Cases Database Schema
-- Generated from analysis of 11 CSV files
-- This schema accommodates all columns found across all files

CREATE TABLE IF NOT EXISTS legal_affairs_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Core case identification and data
     TEXT, -- From 14/11 files: ''
    ag_file_reference TEXT, -- From 11/11 files: 'AG FILE REFERENCE'
    case TEXT, -- From 2/11 files: 'CASE'
    case_no TEXT, -- From 3/11 files: 'CASE NO'
    case_parties TEXT, -- From 11/11 files: 'CASE PARTIES'
    case_year INTEGER, -- From 1/11 files: 'CASE YEAR'
    counsel_dealing TEXT, -- From 1/11 files: 'COUNSEL DEALING'
    court TEXT, -- From 1/11 files: 'COURT'
    court_rank TEXT, -- From 2/11 files: 'COURT RANK'
    court_station TEXT, -- From 11/11 files: 'COURT STATION'
    current_case_status TEXT, -- From 11/11 files: 'CURRENT CASE STATUS'
    ministry TEXT, -- From 1/11 files: 'MINISTRY'
    nature_of_claim_new TEXT, -- From 1/11 files: 'NATURE OF CLAIM (NEW)'
    nature_of_the_claim_nature_of_the_claim_potential_liability TEXT, -- From 1/11 files: 'NATURE OF THE CLAIM NATURE OF THE CLAIM POTENTIAL LIABILITY'
    nature_of_the_claim_new TEXT, -- From 10/11 files: 'NATURE OF THE CLAIM NEW'
    nature_of_the_claim_old TEXT, -- From 1/11 files: 'NATURE OF THE CLAIM OLD'
    potential_liability_ksh TEXT, -- From 1/11 files: 'POTENTIAL LIABILITY (KSH)'
    potential_liability_kshs TEXT, -- From 10/11 files: 'POTENTIAL LIABILITY (KSHS)'
    region TEXT, -- From 1/11 files: 'REGION'
    remarks TEXT, -- From 11/11 files: 'REMARKS'
    serial_no_ TEXT, -- From 3/11 files: 'Serial No.'
    sheet_name TEXT, -- From 3/11 files: 'Sheet Name'

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
