-- Improved Legal Affairs Cases Database Schema
-- Based on analysis of 11 CSV files containing 787+ case records
-- Normalized and optimized for the OAG Data Portal

CREATE TABLE IF NOT EXISTS legal_affairs_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Core case identification
    ag_file_reference TEXT NOT NULL, -- Primary case identifier (appears in 100% of files)
    serial_number TEXT, -- Serial number from source data
    
    -- Court information
    court_station TEXT NOT NULL, -- Court location (appears in 100% of files)
    court_rank TEXT, -- Court level (ELC, COA, etc.)
    court TEXT, -- Specific court designation
    
    -- Case details
    case_number TEXT, -- Court case number
    case_year INTEGER, -- Year case was filed
    case_parties TEXT NOT NULL, -- Plaintiffs vs defendants (appears in 100% of files)
    
    -- Nature of claim (normalized from multiple variations)
    nature_of_claim TEXT, -- Unified field for all claim types
    nature_of_claim_old TEXT, -- Legacy claim description
    
    -- Financial information
    potential_liability DECIMAL(15,2), -- Normalized liability amount in KSH
    potential_liability_raw TEXT, -- Original text value for reference
    
    -- Case status and progress
    current_case_status TEXT NOT NULL, -- Case progress status (appears in 100% of files)
    remarks TEXT, -- Case actions/notes (appears in 100% of files)
    
    -- Administrative information
    ministry TEXT, -- Responsible ministry
    counsel_dealing TEXT, -- Assigned counsel/lawyer
    region TEXT, -- Geographic region
    sheet_name TEXT, -- Source worksheet name
    
    -- Import and data quality metadata
    file_source TEXT NOT NULL, -- Original CSV file name
    import_batch_id UUID, -- Batch import tracking
    data_quality_score INTEGER DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    
    -- Audit fields
    last_modified_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    
    -- Full-text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(ag_file_reference, '') || ' ' ||
            coalesce(case_parties, '') || ' ' ||
            coalesce(nature_of_claim, '') || ' ' ||
            coalesce(current_case_status, '') || ' ' ||
            coalesce(remarks, '')
        )
    ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_ag_reference ON legal_affairs_cases(ag_file_reference);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_court_station ON legal_affairs_cases(court_station);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_case_status ON legal_affairs_cases(current_case_status);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_created_at ON legal_affairs_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_case_year ON legal_affairs_cases(case_year);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_liability ON legal_affairs_cases(potential_liability);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_file_source ON legal_affairs_cases(file_source);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_import_batch ON legal_affairs_cases(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_legal_affairs_cases_search ON legal_affairs_cases USING GIN(search_vector);

-- Enable Row Level Security
ALTER TABLE legal_affairs_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read (open access model)
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

-- RLS Policy: Admins can delete records
CREATE POLICY "legal_affairs_cases_delete_policy" ON legal_affairs_cases
    FOR DELETE USING (
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

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_case_data_quality(case_record legal_affairs_cases)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- AG File Reference (Required) - 20 points
    IF case_record.ag_file_reference IS NOT NULL AND case_record.ag_file_reference != '' THEN
        score := score + 20;
    END IF;
    
    -- Court Station (Required) - 15 points
    IF case_record.court_station IS NOT NULL AND case_record.court_station != '' THEN
        score := score + 15;
    END IF;
    
    -- Case Parties (Required) - 15 points
    IF case_record.case_parties IS NOT NULL AND case_record.case_parties != '' THEN
        score := score + 15;
    END IF;
    
    -- Current Case Status (Required) - 15 points
    IF case_record.current_case_status IS NOT NULL AND case_record.current_case_status != '' THEN
        score := score + 15;
    END IF;
    
    -- Nature of Claim - 10 points
    IF case_record.nature_of_claim IS NOT NULL AND case_record.nature_of_claim != '' THEN
        score := score + 10;
    END IF;
    
    -- Potential Liability - 10 points
    IF case_record.potential_liability IS NOT NULL AND case_record.potential_liability > 0 THEN
        score := score + 10;
    END IF;
    
    -- Case Number - 5 points
    IF case_record.case_number IS NOT NULL AND case_record.case_number != '' THEN
        score := score + 5;
    END IF;
    
    -- Case Year - 5 points
    IF case_record.case_year IS NOT NULL AND case_record.case_year > 1900 THEN
        score := score + 5;
    END IF;
    
    -- Remarks - 5 points
    IF case_record.remarks IS NOT NULL AND case_record.remarks != '' THEN
        score := score + 5;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate data quality score
CREATE OR REPLACE FUNCTION update_case_data_quality()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_quality_score := calculate_case_data_quality(NEW);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_data_quality
    BEFORE INSERT OR UPDATE ON legal_affairs_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_case_data_quality();

-- Create import batch tracking table
CREATE TABLE IF NOT EXISTS legal_affairs_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    file_name TEXT NOT NULL,
    file_size INTEGER,
    total_records INTEGER DEFAULT 0,
    imported_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for import batches
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON legal_affairs_import_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON legal_affairs_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_at ON legal_affairs_import_batches(created_at);

-- RLS for import batches
ALTER TABLE legal_affairs_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_batches_select_policy" ON legal_affairs_import_batches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "import_batches_insert_policy" ON legal_affairs_import_batches
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "import_batches_update_policy" ON legal_affairs_import_batches
    FOR UPDATE USING (auth.uid() = created_by);

-- Create analytics views for better performance
CREATE OR REPLACE VIEW legal_affairs_analytics AS
SELECT 
    court_station,
    current_case_status,
    nature_of_claim,
    EXTRACT(YEAR FROM created_at) as import_year,
    case_year,
    COUNT(*) as case_count,
    SUM(potential_liability) as total_liability,
    AVG(potential_liability) as avg_liability,
    AVG(data_quality_score) as avg_quality_score
FROM legal_affairs_cases 
GROUP BY court_station, current_case_status, nature_of_claim, EXTRACT(YEAR FROM created_at), case_year;

-- Grant access to analytics view
GRANT SELECT ON legal_affairs_analytics TO authenticated;