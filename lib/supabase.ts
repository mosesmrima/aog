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
          files: string | null;
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
          files?: string | null;
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
          files?: string | null;
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
      societies: {
        Row: {
          id: string;
          registration_number: string | null;
          society_name: string | null;
          registration_date: string | null;
          registry_office: string | null;
          address: string | null;
          nature_of_society: string | null;
          member_class: string | null;
          member_count: number | null;
          chairman_name: string | null;
          secretary_name: string | null;
          treasurer_name: string | null;
          registration_status: string | null;
          data_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_number?: string | null;
          society_name?: string | null;
          registration_date?: string | null;
          registry_office?: string | null;
          address?: string | null;
          nature_of_society?: string | null;
          member_class?: string | null;
          member_count?: number | null;
          chairman_name?: string | null;
          secretary_name?: string | null;
          treasurer_name?: string | null;
          registration_status?: string | null;
          data_source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_number?: string | null;
          society_name?: string | null;
          registration_date?: string | null;
          registry_office?: string | null;
          address?: string | null;
          nature_of_society?: string | null;
          member_class?: string | null;
          member_count?: number | null;
          chairman_name?: string | null;
          secretary_name?: string | null;
          treasurer_name?: string | null;
          registration_status?: string | null;
          data_source?: string | null;
          created_at?: string;
        };
      };
      government_cases: {
        Row: {
          id: string;
          ag_file_reference: string | null;
          court_station: string | null;
          court_rank: string | null;
          case_no: string | null;
          case_year: number | null;
          nature_of_claim_new: string | null;
          nature_of_claim_old: string | null;
          current_case_status: string | null;
          region: string | null;
          ministry: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ag_file_reference?: string | null;
          court_station?: string | null;
          court_rank?: string | null;
          case_no?: string | null;
          case_year?: number | null;
          nature_of_claim_new?: string | null;
          nature_of_claim_old?: string | null;
          current_case_status?: string | null;
          region?: string | null;
          ministry?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ag_file_reference?: string | null;
          court_station?: string | null;
          court_rank?: string | null;
          case_no?: string | null;
          case_year?: number | null;
          nature_of_claim_new?: string | null;
          nature_of_claim_old?: string | null;
          current_case_status?: string | null;
          region?: string | null;
          ministry?: string | null;
          created_at?: string;
        };
      };
    };
  };
};