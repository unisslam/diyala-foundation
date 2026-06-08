import { useSupabaseQuery } from './useSupabaseQuery';
import type { Testimonial } from '@/types/testimonial.types';

export function useTestimonials() {
  const { data, loading, error } = useSupabaseQuery<Testimonial>({
    table: 'testimonials',
    filters: { status: 'approved' },
    orderBy: { column: 'created_at', ascending: false },
  });

  return { testimonials: data, loading, error };
}
