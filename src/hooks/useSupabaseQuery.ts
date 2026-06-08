import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export function useSupabaseQuery<T>({
  table,
  select = '*',
  filters,
  orderBy,
  limit,
}: UseSupabaseQueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let query = supabase.from(table).select(select);

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setData((result as unknown as T[]) || []);
      } catch (err) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit]);

  return { data, loading, error };
}
