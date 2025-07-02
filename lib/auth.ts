import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_approved: boolean;
  departments?: string[];
}

export async function signUp(email: string, password: string, fullName: string, departmentId: string) {
  console.log('Starting signup process...');
  console.log('Email:', email);
  console.log('Full Name:', fullName);
  console.log('Department ID:', departmentId);
  
  try {
    // First, sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('Supabase auth signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Auth signup successful:', authData.user.id);

    // Try to create the user profile, handling the race condition with database triggers
    try {
      console.log('Creating user profile...');
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          is_admin: false,
          is_approved: false
        });

      if (createProfileError) {
        // Check if this is a duplicate key error (profile already created by trigger)
        if (createProfileError.code === '23505') {
          console.log('User profile already exists (created by database trigger)');
        } else {
          console.error('Profile creation error:', createProfileError);
          throw new Error(`Failed to create user profile: ${createProfileError.message}`);
        }
      } else {
        console.log('User profile created successfully');
      }
    } catch (error: any) {
      // Handle the duplicate key error gracefully
      if (error.code === '23505') {
        console.log('User profile already exists (created by database trigger)');
      } else {
        throw error;
      }
    }

    // Now assign the user to the selected department
    console.log('Assigning user to department:', departmentId);
    const { error: deptError } = await supabase
      .from('user_departments')
      .insert({
        user_id: authData.user.id,
        department_id: departmentId,
      });

    if (deptError) {
      console.error('Department assignment error:', deptError);
      // This is a critical error - registration should fail if department assignment fails
      throw new Error(`Failed to assign user to department: ${deptError.message}. Please contact administrator.`);
    } else {
      console.log('Department assignment successful');
    }

    // Sign out the user immediately after registration
    await supabase.auth.signOut();
    console.log('User signed out after registration');

    return authData;
  } catch (error) {
    console.error('Full signup error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // First, get the user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  // Then, get their department assignments separately (left join equivalent)
  const { data: userDepartments } = await supabase
    .from('user_departments')
    .select(`
      departments (name)
    `)
    .eq('user_id', user.id);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    is_admin: profile.is_admin,
    is_approved: profile.is_approved,
    departments: userDepartments?.map((ud: any) => ud.departments.name) || [],
  };
}

export async function getDepartments() {
  console.log('Fetching departments...');
  
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }

    console.log('Departments fetched successfully:', data);
    return data || [];
  } catch (error) {
    console.error('Full departments fetch error:', error);
    throw error;
  }
}