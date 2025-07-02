'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';

export interface Marriage {
  id: string;
  marriage_date: string;
  groom_name: string;
  bride_name: string;
  place_of_marriage: string;
  certificate_number: string | null;
  license_type: string | null;
  created_at: string;
  data_quality_score?: number;
  missing_fields?: string[];
  has_duplicates?: boolean;
  import_warnings?: any;
  files?: any;
}

export interface MarriageFilters {
  search?: string;
  searchField?: 'all' | 'groom_name' | 'bride_name' | 'certificate_number' | 'place_of_marriage';
  dateFrom?: string;
  dateTo?: string;
  qualityScore?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function useMarriages(
  filters: MarriageFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marriages', filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('marriages')
        .select('*', { count: 'exact' })
        .order('marriage_date', { ascending: false });

      // Apply robust and precise search filters
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        
        // For certificate number search (progressive partial matching)
        if (filters.searchField === 'certificate_number') {
          // Always use partial matching for progressive search (4 -> 48 -> 488 -> 4884 -> 48849)
          query = query.ilike('certificate_number', `%${searchTerm}%`);
        } 
        // For name searches (handle multiple words and partial matches)
        else if (filters.searchField === 'groom_name' || filters.searchField === 'bride_name') {
          const field = filters.searchField;
          
          // Split search term into words for better matching
          const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
          
          if (words.length === 1) {
            // Single word - use ilike for partial matching
            query = query.ilike(field, `%${words[0]}%`);
          } else {
            // Multiple words - search for the full phrase
            query = query.ilike(field, `%${searchTerm}%`);
          }
        }
        // For place searches
        else if (filters.searchField === 'place_of_marriage') {
          query = query.ilike('place_of_marriage', `%${searchTerm}%`);
        } 
        // Search all fields with intelligent matching
        else {
          const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
          
          if (words.length === 1) {
            const word = words[0];
            // For single word, search across all fields with progressive matching
            if (/^\d+$/.test(word)) {
              // If it's a number, use partial matching for progressive search
              query = query.or(`certificate_number.ilike.%${word}%,groom_name.ilike.%${word}%,bride_name.ilike.%${word}%,place_of_marriage.ilike.%${word}%`);
            } else {
              query = query.or(`groom_name.ilike.%${word}%,bride_name.ilike.%${word}%,certificate_number.ilike.%${word}%,place_of_marriage.ilike.%${word}%`);
            }
          } else {
            // For multiple words, try to match as full names in groom/bride fields
            const fullSearchTerm = searchTerm;
            query = query.or(`groom_name.ilike.%${fullSearchTerm}%,bride_name.ilike.%${fullSearchTerm}%,place_of_marriage.ilike.%${fullSearchTerm}%`);
          }
        }
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('marriage_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('marriage_date', filters.dateTo);
      }

      // Apply quality filter
      if (filters.qualityScore !== undefined) {
        query = query.gte('data_quality_score', filters.qualityScore);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.pageSize),
        currentPage: pagination.page,
        pageSize: pagination.pageSize
      };
    },
    enabled: !!user,
  });
}

export function useMarriageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marriage-stats'],
    queryFn: async () => {
      // Get total count
      const { count: totalCount } = await supabase
        .from('marriages')
        .select('*', { count: 'exact', head: true });

      // Get quality distribution
      const { data: qualityData } = await supabase
        .from('marriages')
        .select('data_quality_score');

      // Get marriages by month (based on marriage_date)
      const { data: monthlyData } = await supabase
        .from('marriages')
        .select('marriage_date')
        .order('marriage_date', { ascending: false });

      const qualityDistribution = {
        high: qualityData?.filter(m => (m.data_quality_score ?? 100) >= 90).length || 0,
        medium: qualityData?.filter(m => (m.data_quality_score ?? 100) >= 70 && (m.data_quality_score ?? 100) < 90).length || 0,
        low: qualityData?.filter(m => (m.data_quality_score ?? 100) < 70).length || 0,
      };

      // Group by month for chart
      const monthlyStats = monthlyData?.reduce((acc: Record<string, number>, marriage) => {
        const month = new Date(marriage.marriage_date).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalCount: totalCount || 0,
        qualityDistribution,
        monthlyStats
      };
    },
    enabled: !!user,
  });
}

export function useDeleteMarriage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marriageId: string) => {
      const { error } = await supabase
        .from('marriages')
        .delete()
        .eq('id', marriageId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch marriages data
      queryClient.invalidateQueries({ queryKey: ['marriages'] });
      queryClient.invalidateQueries({ queryKey: ['marriage-stats'] });
    },
  });
}

export function useCreateMarriage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marriage: Omit<Marriage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('marriages')
        .insert([marriage])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marriages'] });
      queryClient.invalidateQueries({ queryKey: ['marriage-stats'] });
    },
  });
}

export function useUpdateMarriage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Marriage> & { id: string }) => {
      const { data, error } = await supabase
        .from('marriages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marriages'] });
      queryClient.invalidateQueries({ queryKey: ['marriage-stats'] });
    },
  });
}