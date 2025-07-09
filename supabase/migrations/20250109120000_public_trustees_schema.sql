-- Create public_trustees table
CREATE TABLE public_trustees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_cause_no VARCHAR(100),
  folio_no VARCHAR(50),
  deceased_name VARCHAR(255),
  gender VARCHAR(10),
  marital_status VARCHAR(20),
  date_of_death DATE,
  religion VARCHAR(50),
  county VARCHAR(100),
  station VARCHAR(100),
  assets TEXT,
  beneficiaries TEXT,
  telephone_no VARCHAR(20),
  date_of_advertisement DATE,
  date_of_confirmation DATE,
  date_account_drawn DATE,
  date_payment_made DATE,
  file_year INTEGER,
  original_file_name VARCHAR(255),
  data_source VARCHAR(100),
  data_quality_score INTEGER DEFAULT 0,
  missing_fields TEXT[],
  import_warnings JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for search performance
CREATE INDEX idx_public_trustees_pt_cause_no ON public_trustees(pt_cause_no);
CREATE INDEX idx_public_trustees_folio_no ON public_trustees(folio_no);
CREATE INDEX idx_public_trustees_deceased_name ON public_trustees(deceased_name);
CREATE INDEX idx_public_trustees_county ON public_trustees(county);
CREATE INDEX idx_public_trustees_station ON public_trustees(station);
CREATE INDEX idx_public_trustees_file_year ON public_trustees(file_year);
CREATE INDEX idx_public_trustees_date_of_death ON public_trustees(date_of_death);
CREATE INDEX idx_public_trustees_created_at ON public_trustees(created_at);

-- Create full-text search index for name searches
CREATE INDEX idx_public_trustees_deceased_name_fts ON public_trustees USING gin(to_tsvector('english', deceased_name));

-- Create composite index for common search patterns
CREATE INDEX idx_public_trustees_search_combo ON public_trustees(pt_cause_no, folio_no, deceased_name);

-- Row Level Security (RLS) policies
ALTER TABLE public_trustees ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (limited fields only)
CREATE POLICY "Public trustees read access" ON public_trustees
  FOR SELECT
  USING (true);

-- Policy for authenticated users full access
CREATE POLICY "Authenticated users full access" ON public_trustees
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Policy for admin operations
CREATE POLICY "Admin full access" ON public_trustees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_public_trustees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_public_trustees_updated_at
  BEFORE UPDATE ON public_trustees
  FOR EACH ROW
  EXECUTE FUNCTION update_public_trustees_updated_at();

-- Create function to extract station from pt_cause_no
CREATE OR REPLACE FUNCTION extract_station_from_pt_cause(pt_cause_no TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract station from patterns like "PT/01/2023" or "PT/942/03"
  IF pt_cause_no IS NULL OR pt_cause_no = '' THEN
    RETURN NULL;
  END IF;
  
  -- For patterns like "PT/01/2023", extract the middle part
  IF pt_cause_no ~ '^PT/[0-9]+/[0-9]+' THEN
    RETURN SPLIT_PART(pt_cause_no, '/', 2);
  END IF;
  
  -- For other patterns, return as is
  RETURN pt_cause_no;
END;
$$ LANGUAGE plpgsql;

-- Create function to standardize county names
CREATE OR REPLACE FUNCTION standardize_county_name(county_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF county_name IS NULL OR county_name = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to uppercase and trim
  county_name := UPPER(TRIM(county_name));
  
  -- Handle common variations
  CASE county_name
    WHEN 'NRBI', 'NRB', 'NAIROBI CITY' THEN
      RETURN 'NAIROBI';
    WHEN 'MSA', 'MOMBASA CITY' THEN
      RETURN 'MOMBASA';
    WHEN 'UASIN GISHU' THEN
      RETURN 'UASIN GISHU';
    WHEN 'TRANS NZOIA' THEN
      RETURN 'TRANS NZOIA';
    WHEN 'WEST POKOT' THEN
      RETURN 'WEST POKOT';
    WHEN 'ELGEYO MARAKWET' THEN
      RETURN 'ELGEYO MARAKWET';
    WHEN 'TANA RIVER' THEN
      RETURN 'TANA RIVER';
    WHEN 'TAITA TAVETA' THEN
      RETURN 'TAITA TAVETA';
    ELSE
      RETURN county_name;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_trustees_data_quality(
  pt_cause_no TEXT,
  folio_no TEXT,
  deceased_name TEXT,
  gender TEXT,
  marital_status TEXT,
  date_of_death DATE,
  religion TEXT,
  county TEXT,
  assets TEXT,
  beneficiaries TEXT
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  total_fields INTEGER := 10;
BEGIN
  -- Count non-empty fields
  IF pt_cause_no IS NOT NULL AND pt_cause_no != '' THEN score := score + 1; END IF;
  IF folio_no IS NOT NULL AND folio_no != '' THEN score := score + 1; END IF;
  IF deceased_name IS NOT NULL AND deceased_name != '' THEN score := score + 1; END IF;
  IF gender IS NOT NULL AND gender != '' THEN score := score + 1; END IF;
  IF marital_status IS NOT NULL AND marital_status != '' THEN score := score + 1; END IF;
  IF date_of_death IS NOT NULL THEN score := score + 1; END IF;
  IF religion IS NOT NULL AND religion != '' THEN score := score + 1; END IF;
  IF county IS NOT NULL AND county != '' THEN score := score + 1; END IF;
  IF assets IS NOT NULL AND assets != '' THEN score := score + 1; END IF;
  IF beneficiaries IS NOT NULL AND beneficiaries != '' THEN score := score + 1; END IF;
  
  -- Return percentage
  RETURN (score * 100) / total_fields;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table for trustees
CREATE TABLE public_trustees_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trustees_id UUID REFERENCES public_trustees(id),
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Create audit trigger
CREATE OR REPLACE FUNCTION audit_public_trustees_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public_trustees_audit (trustees_id, action, new_values, changed_by)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public_trustees_audit (trustees_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public_trustees_audit (trustees_id, action, old_values, changed_by)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_public_trustees
  AFTER INSERT OR UPDATE OR DELETE ON public_trustees
  FOR EACH ROW
  EXECUTE FUNCTION audit_public_trustees_changes();

-- Create statistics view for analytics
CREATE OR REPLACE VIEW public_trustees_stats AS
SELECT 
  COUNT(*) as total_trustees,
  COUNT(CASE WHEN gender = 'MALE' THEN 1 END) as male_count,
  COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) as female_count,
  COUNT(CASE WHEN marital_status = 'MARRIED' THEN 1 END) as married_count,
  COUNT(CASE WHEN marital_status = 'SINGLE' THEN 1 END) as single_count,
  COUNT(CASE WHEN date_of_death >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as recent_deaths,
  AVG(data_quality_score) as avg_quality_score,
  MIN(file_year) as earliest_year,
  MAX(file_year) as latest_year,
  COUNT(DISTINCT county) as unique_counties,
  COUNT(DISTINCT station) as unique_stations
FROM public_trustees;

-- Grant permissions
GRANT SELECT ON public_trustees TO anon;
GRANT SELECT ON public_trustees TO authenticated;
GRANT SELECT ON public_trustees_stats TO anon;
GRANT SELECT ON public_trustees_stats TO authenticated;

-- Sample data removed for production deployment
-- Use CSV import functionality to populate data

-- Create comment for documentation
COMMENT ON TABLE public_trustees IS 'Public Trustees records for deceased estates management';
COMMENT ON COLUMN public_trustees.pt_cause_no IS 'PT Cause Number with station identifier';
COMMENT ON COLUMN public_trustees.folio_no IS 'Folio number for the case';
COMMENT ON COLUMN public_trustees.deceased_name IS 'Full name of the deceased person';
COMMENT ON COLUMN public_trustees.data_quality_score IS 'Percentage score of data completeness (0-100)';
COMMENT ON COLUMN public_trustees.missing_fields IS 'Array of field names that are missing data';
COMMENT ON COLUMN public_trustees.import_warnings IS 'JSON object containing import warnings and issues';