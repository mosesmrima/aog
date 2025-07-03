import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          is_admin: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          is_admin?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          is_admin?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_departments: {
        Row: {
          id: string;
          user_id: string;
          department_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          department_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          department_id?: string;
          created_at?: string;
        };
      };
      marriages: {
        Row: {
          id: string;
          marriage_date: string | null;
          groom_name: string | null;
          bride_name: string | null;
          place_of_marriage: string | null;
          certificate_number: string | null;
          license_type: string | null;
          files: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          data_quality_score: number;
          missing_fields: string[];
          has_duplicates: boolean;
          import_warnings: any;
        };
        Insert: {
          id?: string;
          marriage_date?: string | null;
          groom_name?: string | null;
          bride_name?: string | null;
          place_of_marriage?: string | null;
          certificate_number?: string | null;
          license_type?: string | null;
          files?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          data_quality_score?: number;
          missing_fields?: string[];
          has_duplicates?: boolean;
          import_warnings?: any;
        };
        Update: {
          id?: string;
          marriage_date?: string | null;
          groom_name?: string | null;
          bride_name?: string | null;
          place_of_marriage?: string | null;
          certificate_number?: string | null;
          license_type?: string | null;
          files?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          data_quality_score?: number;
          missing_fields?: string[];
          has_duplicates?: boolean;
          import_warnings?: any;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: any | null;
          new_values: any | null;
          department_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: any | null;
          new_values?: any | null;
          department_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: any | null;
          new_values?: any | null;
          department_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};