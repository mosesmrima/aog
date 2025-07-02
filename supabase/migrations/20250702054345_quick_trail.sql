/*
  # Fix Departments RLS Policy

  1. Changes
    - Drop the existing restrictive policy for departments
    - Create a new policy that allows public read access to departments
    - This allows unauthenticated users to view departments during registration

  2. Security
    - Only SELECT operations are allowed for public users
    - INSERT, UPDATE, DELETE still require authentication and admin privileges
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;

-- Create a new policy that allows public read access
CREATE POLICY "Public can view departments"
  ON departments FOR SELECT
  TO public
  USING (true);

-- Ensure admins can still manage departments
CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true AND is_approved = true
    )
  );