import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';
import { syncLeadsToSheet } from '@/lib/gsheets';
import type { Lead } from '@/lib/sheets';
import type { EventId } from '@/lib/event-config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SYMPLA_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sinceParam = req.nextUrl.searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : new Date('2026-05-11');
  const eventId = (req.nextUrl.searchParams.get('event_id') ?? process.env.SYMPLA_EVENT_ID_1 ?? '3420900') as EventId;

  const supabase = getSupabaseAdmin(eventId);

  // Busca TODOS os participantes para detectar exclusões
  const allParticipants = await fetchAllParticipants(undefined, eventId);
  const activeIds = new Set(allParticipants.map((p) => String(p.id)));

  // Guarda de segurança: só deleta se a API retornou pelo menos 1 participante
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
      const { error: delError } = await supabase.from('leads').delete().in('sympla_id', toDelete);
      if (delError) console.error('[sympla/sync] delete error:', delError);
      else deleted = toDelete.length;
    }
  }

  // Upsert apenas participantes dentro do período
  const toSync = allParticipants.filter((p) => {
    const dateStr = p.order_approved_date ?? p.order_date;
    if (!dateStr) return false;
    return new Date(dateStr) >= since;
  });

  const rows = toSync.map((p) => participantToRow(p, eventId));

  if (rows.length > 0) {
    const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'sympla_id' });
    if (error) {
      console.error('[sympla/sync] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Atualiza Google Sheets com o estado atual
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
  let sheetsError: string | null = null;
  try {
    const result = await syncLeadsToSheet(leads, eventId);
    sheetsUpdated = result.updated;
  } catch (err) {
    sheetsError = err instanceof Error ? err.message : String(err);
    console.error('[sympla/sync] sheets error:', err);
  }

  return NextResponse.json({ ok: true, synced: rows.length, deleted, sheets: sheetsUpdated, sheetsError });
}
