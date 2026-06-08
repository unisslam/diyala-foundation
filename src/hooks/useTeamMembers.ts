import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/types/database.types';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

export function useTeamMembers() {
  const { data, loading, error } = useSupabaseQuery<TeamMember>({
    table: 'team_members',
    filters: { is_active: true },
    orderBy: { column: 'display_order', ascending: true },
  });

  return { teamMembers: data, loading, error };
}
