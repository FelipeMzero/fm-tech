import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://qovxwtylbyfhuficavjz.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_wbe-ee2hxNf9d_ZfqmyffA_KWLUioVa';

export function getCleanSupabaseUrl(url?: string): string {
  const raw = url || localStorage.getItem('mapos_pf_supabase_url') || DEFAULT_SUPABASE_URL;
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '').trim();
}

export function getSupabaseAnonKey(key?: string): string {
  return (key || localStorage.getItem('mapos_pf_supabase_key') || DEFAULT_SUPABASE_KEY).trim();
}

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  const finalUrl = getCleanSupabaseUrl(url);
  const finalKey = getSupabaseAnonKey(anonKey);

  if (!clientInstance || lastUrl !== finalUrl || lastKey !== finalKey) {
    lastUrl = finalUrl;
    lastKey = finalKey;
    clientInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}
