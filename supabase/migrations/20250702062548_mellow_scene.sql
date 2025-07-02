/*
  # Fix RLS Policies - Handle Existing Policies

  1. Changes
    - Drop all existing policies that might conflict
    - Create helper function to prevent infinite recursion
    - Recreate all policies with proper logic
    - Handle existing tables and policies gracefully

  2. Security
    - Fix infinite recursion in admin checks
    - Maintain proper access control
    - Ensure registration works for new users
*/

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

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Public can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Admins can view all department assignments" ON user_departments;
DROP POLICY IF EXISTS "Admins can manage department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can assign themselves to departments during signup" ON user_departments;

DROP POLICY IF EXISTS "Users can view marriages from their departments" ON marriages;
DROP POLICY IF EXISTS "Users can manage marriages in their departments" ON marriages;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- RLS Policies for departments
CREATE POLICY "Public can view departments"
  ON departments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

CREATE POLICY "Users can create own profile during signup"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

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

CREATE POLICY "Users can assign themselves to departments during signup"
  ON user_departments FOR INSERT
  TO public
  WITH CHECK (true);

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