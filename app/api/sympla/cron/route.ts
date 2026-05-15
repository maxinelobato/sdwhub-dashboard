import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';
import { syncLeadsToSheet } from '@/lib/gsheets';
import type { Lead } from '@/lib/sheets';
import { EVENT_IDS, type EventId } from '@/lib/event-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SINCE = new Date('2026-05-11');

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<EventId, { synced: number; deleted: number; sheets: number }> = {} as never;

  for (const eventId of EVENT_IDS) {
    const supabase = getSupabaseAdmin(eventId);
    const allParticipants = await fetchAllParticipants(undefined, eventId);
    const activeIds = new Set(allParticipants.map((p) => String(p.id)));

    let deleted = 0;
    if (allParticipants.length > 0) {
      const { data: existing } = await supabase
        .from('leads')
        .select('sympla_id')
        .eq('fonte', 'sympla')
        .not('sympla_id', 'is', null);

      const toDelete = (existing ?? [])
        .map((r) => r.sympla_id as string)
        .filter((id) => !activeIds.has(id));

      if (toDelete.length > 0) {
        const { error } = await supabase.from('leads').delete().in('sympla_id', toDelete);
        if (!error) deleted = toDelete.length;
      }
    }

    const toSync = allParticipants.filter((p) => {
      const dateStr = p.order_approved_date ?? p.order_date;
      return dateStr ? new Date(dateStr) >= SINCE : false;
    });

    const rows = toSync.map((p) => participantToRow(p, eventId));

    if (rows.length > 0) {
      await supabase.from('leads').upsert(rows, { onConflict: 'sympla_id' });
    }

    const leads: Lead[] = rows.map((r, i) => ({
      rowIndex: i,
      timestamp: r.data_compra ? new Date(r.data_compra as string) : null,
      ordemInscricao: r.ordem_inscricao ?? undefined,
      nome: r.nome ?? '',
      sobrenome: r.sobrenome ?? '',
      whatsapp: r.whatsapp ?? '',
      utmSource: r.utm_source ?? '',
      utmCampaign: r.utm_campaign ?? '',
      utmContent: r.utm_content ?? '',
      utmTerm: r.utm_term ?? '',
      fonte: r.fonte ?? 'sympla',
      raw: {},
    }));

    let sheetsUpdated = 0;
    try {
      const result = await syncLeadsToSheet(leads, eventId);
      sheetsUpdated = result.updated;
    } catch (err) {
      console.error(`[cron] sheets error (${eventId}):`, err);
    }

    results[eventId] = { synced: rows.length, deleted, sheets: sheetsUpdated };
  }

  return NextResponse.json({ ok: true, results });
}
