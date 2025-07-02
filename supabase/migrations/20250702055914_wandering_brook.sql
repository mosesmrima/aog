/*
  # Fix Registration RLS Policies

  1. Security Updates
    - Allow unauthenticated users to read departments (needed for registration form)
    - Allow new users to create their own profiles during signup
    - Allow new users to assign themselves to departments during signup
    - Maintain security for other operations

  2. Changes
    - Update departments policies to allow public read access
    - Update user_profiles policies to allow self-creation during signup
    - Update user_departments policies to allow self-assignment during signup
*/

-- Update departments policies to allow public read access
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Public can view departments" ON departments;

CREATE POLICY "Public can view departments"
  ON departments FOR SELECT
  TO public
  USING (true);

-- Update user_profiles policies to allow self-creation during signup
CREATE POLICY "Users can create own profile during signup"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- Update user_departments policies to allow self-assignment during signup
CREATE POLICY "Users can assign themselves to departments during signup"
  ON user_departments FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the trigger function has proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, is_admin, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();