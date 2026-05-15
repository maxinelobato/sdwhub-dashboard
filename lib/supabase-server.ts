import { createClient } from '@supabase/supabase-js';
import type { EventId } from './event-config';

const SERVER_CONFIG: Record<EventId, { url: string; serviceKey: string }> = {
  '3420900': {
    url: 'https://qudpaabuwjajsapmdwuu.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_3420900 ?? '',
  },
  '3426453': {
    url: 'https://ltcgnznousgkwknqkikc.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_3426453 ?? '',
  },
};

export function getSupabaseAdmin(eventId: EventId = '3420900') {
  const { url, serviceKey } = SERVER_CONFIG[eventId];
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Compatibilidade com imports antigos
export const supabaseAdmin = getSupabaseAdmin('3420900');
