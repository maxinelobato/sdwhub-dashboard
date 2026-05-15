import { createClient } from '@supabase/supabase-js';
import { EVENT_CONFIG, type EventId } from './event-config';

const clients = new Map<EventId, ReturnType<typeof createClient>>();

export function getSupabaseClient(eventId: EventId = '3420900') {
  if (!clients.has(eventId)) {
    const { supabaseUrl, supabaseAnonKey } = EVENT_CONFIG[eventId];
    clients.set(
      eventId,
      createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 10 } },
      }),
    );
  }
  return clients.get(eventId)!;
}

// Compatibilidade com imports antigos
export const supabase = getSupabaseClient('3420900');
