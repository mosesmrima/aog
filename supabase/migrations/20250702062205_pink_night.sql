/*
  # Initial Database Schema for OAG Data Portal

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Department name
      - `description` (text) - Department description
      - `created_at` (timestamp)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `is_admin` (boolean, default false)
      - `is_approved` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_departments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `department_id` (uuid, references departments)
      - `created_at` (timestamp)
    
    - `marriages`
      - `id` (uuid, primary key)
      - `marriage_date` (date)
      - `groom_name` (text)
      - `bride_name` (text)
      - `place_of_marriage` (text)
      - `certificate_number` (text, unique)
      - `license_type` (text, optional)
      - `files` (jsonb) - Array of file URLs
      - `created_by` (uuid, references user_profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `action` (text) - CREATE, UPDATE, DELETE
      - `table_name` (text)
      - `record_id` (uuid)
      - `old_values` (jsonb)
      - `new_values` (jsonb)
      - `department_id` (uuid, references departments)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for department-based access control
    - Admin users can access all data
    - Regular users can only access data from their assigned departments

  3. Initial Data
    - Insert default departments
    - Create audit log trigger functions
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  is_admin boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_departments junction table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Create marriages table
CREATE TABLE IF NOT EXISTS marriages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marriage_date date NOT NULL,
  groom_name text NOT NULL,
  bride_name text NOT NULL,
  place_of_marriage text NOT NULL,
  certificate_number text UNIQUE NOT NULL,
  license_type text,
  files jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  department_id uuid REFERENCES departments(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marriages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin (prevents infinite recursion)
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id AND is_admin = true AND is_approved = true);
END;
$$;

-- RLS Policies for departments
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- RLS Policies for user_departments
CREATE POLICY "Users can view own department assignments"
  ON user_departments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all department assignments"
  ON user_departments FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage department assignments"
  ON user_departments FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- RLS Policies for marriages
CREATE POLICY "Users can view marriages from their departments"
  ON marriages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_departments ud ON up.id = ud.user_id
      JOIN departments d ON ud.department_id = d.id
      WHERE up.id = auth.uid() 
      AND up.is_approved = true
      AND d.name = 'Registrar of Marriages'
    )
    OR
    is_admin_user(auth.uid())
  );

CREATE POLICY "Users can manage marriages in their departments"
  ON marriages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_departments ud ON up.id = ud.user_id
      JOIN departments d ON ud.department_id = d.id
      WHERE up.id = auth.uid() 
      AND up.is_approved = true
      AND d.name = 'Registrar of Marriages'
    )
    OR
    is_admin_user(auth.uid())
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Registrar of Marriages', 'Manages marriage registrations and certificates'),
  ('Registrar of Societies', 'Manages society registrations and compliance'),
  ('Legal Affairs', 'Handles legal documentation and compliance'),
  ('Administration', 'Administrative and support functions')
ON CONFLICT (name) DO NOTHING;

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Create function for audit logging
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  dept_id uuid;
BEGIN
  -- Get department ID for marriages table
  IF TG_TABLE_NAME = 'marriages' THEN
    SELECT d.id INTO dept_id 
    FROM departments d 
    WHERE d.name = 'Registrar of Marriages';
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, department_id)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), dept_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, department_id)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), dept_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, department_id)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), dept_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'marriages_audit_trigger') THEN
    CREATE TRIGGER marriages_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON marriages
      FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marriages_updated_at') THEN
    CREATE TRIGGER update_marriages_updated_at
      BEFORE UPDATE ON marriages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;