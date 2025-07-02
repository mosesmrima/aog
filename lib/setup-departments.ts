import { supabase } from './supabase';

export async function setupDefaultDepartments() {
  try {
    // First check if departments already exist
    const { data: existingDepts, error: checkError } = await supabase
      .from('departments')
      .select('id, name');

    if (checkError) {
      console.error('Error checking departments:', checkError);
      throw checkError;
    }

    console.log('Existing departments:', existingDepts);

    // If no departments exist, create them
    if (!existingDepts || existingDepts.length === 0) {
      console.log('No departments found, creating default departments...');
      
      const defaultDepartments = [
        {
          name: 'Registrar of Marriages',
          description: 'Manages marriage registrations and certificates'
        },
        {
          name: 'Registrar of Societies',
          description: 'Manages society registrations and compliance'
        },
        {
          name: 'Legal Affairs',
          description: 'Handles legal documentation and compliance'
        },
        {
          name: 'Administration',
          description: 'Administrative and support functions'
        }
      ];

      const { data: insertedDepts, error: insertError } = await supabase
        .from('departments')
        .insert(defaultDepartments)
        .select();

      if (insertError) {
        console.error('Error inserting departments:', insertError);
        throw insertError;
      }

      console.log('Successfully created departments:', insertedDepts);
      return insertedDepts;
    }

    console.log('Departments already exist:', existingDepts);
    return existingDepts;
  } catch (error) {
    console.error('Setup departments error:', error);
    throw error;
  }
}