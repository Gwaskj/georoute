import { createSupabaseServerClient } from './supabase/server';

export type SubscriptionStatus = 'free' | 'pro';

export async function getSubscriptionStatus(userId: string | null): Promise<SubscriptionStatus> {
  if (!userId) return 'free';

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return 'free';

  return data.status === 'pro' ? 'pro' : 'free';
}
