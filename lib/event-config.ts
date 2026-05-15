export type EventId = '3420900' | '3426453';

export const EVENT_CONFIG = {
  '3420900': {
    id: '3420900' as EventId,
    label: 'SDW BH — Principal',
    supabaseUrl: 'https://qudpaabuwjajsapmdwuu.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_3420900 ?? '',
    csvUrl: process.env.NEXT_PUBLIC_LEADS_CSV_URL_3420900 ?? '',
  },
  '3426453': {
    id: '3426453' as EventId,
    label: 'SDW BH — AB',
    supabaseUrl: 'https://ltcgnznousgkwknqkikc.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_3426453 ?? '',
    csvUrl: process.env.NEXT_PUBLIC_LEADS_CSV_URL_3426453 ?? '',
  },
} as const;

export const EVENT_IDS = Object.keys(EVENT_CONFIG) as EventId[];
export const DEFAULT_EVENT_ID: EventId = '3420900';

export function getEventConfig(eventId: EventId) {
  return EVENT_CONFIG[eventId];
}
