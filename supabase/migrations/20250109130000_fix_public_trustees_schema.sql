-- Fix Public Trustees Schema for CSV Import Issues
-- This migration fixes unique constraint, RLS policies, and data flexibility issues

-- 1. Add unique constraint to pt_cause_no to support upsert operations
ALTER TABLE public_trustees ADD CONSTRAINT unique_pt_cause_no UNIQUE (pt_cause_no);

-- 2. Make schema more permissive to handle messy CSV data
-- Change DATE fields to TEXT to handle inconsistent date formats
ALTER TABLE public_trustees 
  ALTER COLUMN date_of_death TYPE TEXT,
  ALTER COLUMN date_of_advertisement TYPE TEXT,
  ALTER COLUMN date_of_confirmation TYPE TEXT,
  ALTER COLUMN date_account_drawn TYPE TEXT,
  ALTER COLUMN date_payment_made TYPE TEXT;

-- Increase field sizes for variable content
ALTER TABLE public_trustees 
  ALTER COLUMN pt_cause_no TYPE VARCHAR(200),
  ALTER COLUMN folio_no TYPE VARCHAR(100),
  ALTER COLUMN deceased_name TYPE VARCHAR(500),
  ALTER COLUMN county TYPE VARCHAR(200),
  ALTER COLUMN station TYPE VARCHAR(200),
  ALTER COLUMN religion TYPE VARCHAR(100),
  ALTER COLUMN telephone_no TYPE VARCHAR(50);

-- 3. Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Public trustees read access" ON public_trustees;
DROP POLICY IF EXISTS "Authenticated users full access" ON public_trustees;
DROP POLICY IF EXISTS "Admin full access" ON public_trustees;

-- 4. Create new RLS policies matching working patterns from other tables
-- Public read access for registry functionality
CREATE POLICY "Public can view trustees registry"
  ON public_trustees FOR SELECT
  USING (true);

-- Authenticated users can insert/update (for CSV imports)
CREATE POLICY "Authenticated users can manage trustees"
  ON public_trustees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.is_approved = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 5. Create function to normalize pt_cause_no for consistency
CREATE OR REPLACE FUNCTION normalize_pt_cause_no(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Replace backslashes with forward slashes
  -- Remove extra spaces
  -- Ensure consistent format
  RETURN UPPER(TRIM(REPLACE(input_text, '\', '/')));
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to clean and validate dates
CREATE OR REPLACE FUNCTION clean_date_field(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' OR input_text = 'undefined' THEN
    RETURN NULL;
  END IF;
  
  -- Basic cleaning - remove extra whitespace
  RETURN TRIM(input_text);
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to normalize pt_cause_no on insert/update
CREATE OR REPLACE FUNCTION normalize_public_trustees_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize pt_cause_no
  NEW.pt_cause_no = normalize_pt_cause_no(NEW.pt_cause_no);
  
  -- Clean date fields
  NEW.date_of_death = clean_date_field(NEW.date_of_death);
  NEW.date_of_advertisement = clean_date_field(NEW.date_of_advertisement);
  NEW.date_of_confirmation = clean_date_field(NEW.date_of_confirmation);
  NEW.date_account_drawn = clean_date_field(NEW.date_account_drawn);
  NEW.date_payment_made = clean_date_field(NEW.date_payment_made);
  
  -- Ensure import_warnings is properly formatted
  IF NEW.import_warnings IS NULL THEN
    NEW.import_warnings = '[]'::JSONB;
  END IF;
  
  -- Ensure missing_fields is properly formatted
  IF NEW.missing_fields IS NULL THEN
    NEW.missing_fields = ARRAY[]::TEXT[];
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_normalize_public_trustees_data ON public_trustees;

-- Create new trigger
CREATE TRIGGER trigger_normalize_public_trustees_data
  BEFORE INSERT OR UPDATE ON public_trustees
  FOR EACH ROW
  EXECUTE FUNCTION normalize_public_trustees_data();

-- 8. Update indexes for better performance with new field sizes
DROP INDEX IF EXISTS idx_public_trustees_pt_cause_no;
CREATE INDEX idx_public_trustees_pt_cause_no ON public_trustees(pt_cause_no) WHERE pt_cause_no IS NOT NULL;

-- 9. Add index for normalized searching
CREATE INDEX idx_public_trustees_normalized_search ON public_trustees 
  USING gin(to_tsvector('english', COALESCE(deceased_name, '') || ' ' || COALESCE(pt_cause_no, '') || ' ' || COALESCE(folio_no, '')));

-- 10. Create view for statistics that handles NULL values gracefully
CREATE OR REPLACE VIEW public_trustees_stats AS
SELECT
  COUNT(*) as total_trustees,
  COUNT(CASE WHEN gender = 'MALE' THEN 1 END) as male_count,
  COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) as female_count,
  COUNT(CASE WHEN file_year = EXTRACT(YEAR FROM NOW()) THEN 1 END) as this_year,
  COALESCE(MIN(file_year), 0) as earliest_year,
  COALESCE(MAX(file_year), 0) as latest_year,
  COALESCE(AVG(data_quality_score), 0) as avg_quality_score,
  (
    SELECT county 
    FROM public_trustees 
    WHERE county IS NOT NULL AND county != ''
    GROUP BY county 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
  ) as top_county
FROM public_trustees;

-- 11. Grant necessary permissions
GRANT SELECT ON public_trustees_stats TO authenticated;
GRANT SELECT ON public_trustees_stats TO anon;