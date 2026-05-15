import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';
import { syncLeadsToSheet } from '@/lib/gsheets';
import type { Lead } from '@/lib/sheets';
import { EVENT_IDS, type EventId } from '@/lib/event-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SINCE = new Date('2026-05-11');

function dbRowToLead(row: Record<string, unknown>, i: number): Lead {
  return {
    rowIndex: i,
    timestamp: row.data_compra ? new Date(row.data_compra as string) : null,
    ordemInscricao: (row.ordem_inscricao as number) ?? undefined,
    nome: (row.nome as string) ?? '',
    sobrenome: (row.sobrenome as string) ?? '',
    whatsapp: (row.whatsapp as string) ?? '',
    utmSource: (row.utm_source as string) ?? '',
    utmCampaign: (row.utm_campaign as string) ?? '',
    utmContent: (row.utm_content as string) ?? '',
    utmTerm: (row.utm_term as string) ?? '',
    fonte: (row.fonte as string) ?? 'sympla',
    raw: {},
  };
}

async function runSync(eventId: EventId) {
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
  let synced = 0;

  if (rows.length > 0) {
    const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'sympla_id' });
    if (error) throw new Error(`Supabase upsert: ${error.message}`);
    synced = rows.length;
  }

  let sheets = 0;
  const { data: allDbRows } = await supabase
    .from('leads')
    .select('*')
    .order('data_compra', { ascending: true });

  if (allDbRows && allDbRows.length > 0) {
    const leads = allDbRows.map((r, i) => dbRowToLead(r, i));
    const result = await syncLeadsToSheet(leads, eventId);
    sheets = result.updated;
  }

  return { synced, deleted, sheets };
}

// Sympla chama este endpoint a cada nova inscrição aprovada.
//
// Configure no painel Sympla → Integrações → Webhooks:
//   Evento 3420900 → POST https://sdwhub.com.br/api/sympla/webhook?event_id=3420900&secret=SEU_SECRET
//   Evento 3426453 → POST https://sdwhub.com.br/api/sympla/webhook?event_id=3426453&secret=SEU_SECRET
//   Gatilho: order.approved
//
// O event_id também pode vir no body da Sympla (data.event_id).
// Se nenhum event_id for identificado, sincroniza os dois eventos.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.SYMPLA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let eventId = req.nextUrl.searchParams.get('event_id') as EventId | null;

  if (!eventId) {
    try {
      const body = await req.json();
      const fromBody = String(body?.data?.event_id ?? body?.event_id ?? '');
      if (EVENT_IDS.includes(fromBody as EventId)) eventId = fromBody as EventId;
    } catch {
      // body não é JSON — ignora
    }
  }

  const targets: EventId[] = eventId && EVENT_IDS.includes(eventId)
    ? [eventId]
    : [...EVENT_IDS];

  const results: Record<string, unknown> = {};

  for (const eid of targets) {
    try {
      results[eid] = await runSync(eid);
    } catch (err) {
      results[eid] = { error: err instanceof Error ? err.message : String(err) };
      console.error(`[webhook] sync error (${eid}):`, err);
    }
  }

  return NextResponse.json({ ok: true, results });
}
