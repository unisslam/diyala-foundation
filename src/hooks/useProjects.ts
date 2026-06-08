import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ProjectRow, ProjectStatus, ProjectCategory } from '@/types/database.types';

export interface ProjectFilters {
  status?: ProjectStatus | 'all';
  category?: ProjectCategory | 'all';
  search?: string;
  featuredOnly?: boolean;
}

export interface UseProjectsResult {
  data: ProjectRow[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

export function useProjects(filters: ProjectFilters = {}): UseProjectsResult {
  const [data, setData] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw new Error(fetchError.message);

      let projects = (result ?? []) as ProjectRow[];

      // Client-side text search (Arabic + English)
      if (filters.search && filters.search.trim().length > 0) {
        const q = filters.search.trim().toLowerCase();
        projects = projects.filter(
          (p) =>
            p.title_ar?.toLowerCase().includes(q) ||
            p.title_en?.toLowerCase().includes(q) ||
            p.description_ar?.toLowerCase().includes(q) ||
            p.description_en?.toLowerCase().includes(q)
        );
      }

      setData(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [
    filters.status,
    filters.category,
    filters.search,
    filters.featuredOnly,
  ]);

  // Fetch on mount and when filters change
  useState(() => {
    fetchProjects();
  });

  return { data, loading, error, total: data.length, refetch: fetchProjects };
}
