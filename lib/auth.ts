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
  try {
    // Get user from session (this already validates the session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User error in getCurrentUser:', userError);
      return null;
    }
    
    if (!user) {
      console.log('No user found in getCurrentUser');
      return null;
    }

    // Add timeout for database queries (3 seconds for faster failure)
    const dbTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );

    try {
      // Get user profile with timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        dbTimeout
      ]) as any;

      if (profileError) {
        console.error('Profile query error:', profileError);
        return null;
      }

      if (!profile) {
        console.log('No profile found for user:', user.id);
        return null;
      }

      // Get department assignments with timeout (non-critical, continue if fails)
      let userDepartments: any[] = [];
      try {
        const departmentsPromise = supabase
          .from('user_departments')
          .select(`
            departments (name)
          `)
          .eq('user_id', user.id);

        const { data, error: deptError } = await Promise.race([
          departmentsPromise,
          dbTimeout
        ]) as any;

        if (deptError) {
          console.warn('Department query error (non-critical):', deptError);
        } else {
          userDepartments = data || [];
        }
      } catch (deptTimeoutError) {
        console.warn('Department query timeout (non-critical):', deptTimeoutError);
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        is_admin: profile.is_admin,
        is_approved: profile.is_approved,
        departments: userDepartments.map((ud: any) => ud.departments.name) || [],
      };

    } catch (timeoutError) {
      console.error('Database timeout in getCurrentUser:', timeoutError);
      return null;
    }

  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
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