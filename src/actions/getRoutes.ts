import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getRoutes(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching routes:', error);
    return [];
  }

  return data ?? [];
}
