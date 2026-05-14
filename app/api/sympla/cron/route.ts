import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';
import { syncLeadsToSheet } from '@/lib/gsheets';
import type { Lead } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SINCE = new Date('2026-05-11');

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allParticipants = await fetchAllParticipants();
  const activeIds = new Set(allParticipants.map((p) => String(p.id)));

  const { data: existing } = await supabaseAdmin
    .from('leads')
    .select('sympla_id')
    .eq('source', 'sympla');

  const toDelete = (existing ?? [])
    .map((r) => r.sympla_id as string)
    .filter((id) => !activeIds.has(id));

  let deleted = 0;
  if (toDelete.length > 0) {
    const { error } = await supabaseAdmin.from('leads').delete().in('sympla_id', toDelete);
    if (!error) deleted = toDelete.length;
  }

  const toSync = allParticipants.filter((p) => {
    const dateStr = p.order_approved_date ?? p.order_date;
    return dateStr ? new Date(dateStr) >= SINCE : false;
  });

  const rows = toSync.map(participantToRow);

  if (rows.length > 0) {
    await supabaseAdmin.from('leads').upsert(rows, { onConflict: 'sympla_id' });
  }

  const leads: Lead[] = rows.map((r, i) => ({
    rowIndex: i,
    timestamp: r.timestamp ? new Date(r.timestamp) : null,
    nome: r.nome ?? '',
    whatsapp: r.whatsapp ?? '',
    email: r.email ?? '',
    redeSocial: r.rede_social ?? '',
    atuacao: r.atuacao ?? '',
    mercado: r.mercado ?? '',
    emOperacao: r.em_operacao ?? '',
    faturamento: r.faturamento ?? '',
    tamanhoEquipe: r.tamanho_equipe ?? '',
    objetivo: r.objetivo ?? '',
    pretendeParticipar: r.pretende_participar ?? '',
    motivacao: r.motivacao ?? '',
    utmSource: r.utm_source ?? '',
    utmContent: r.utm_content ?? '',
    raw: {},
  }));

  let sheetsUpdated = 0;
  try {
    const result = await syncLeadsToSheet(leads);
    sheetsUpdated = result.updated;
  } catch (err) {
    console.error('[cron] sheets error:', err);
  }

  return NextResponse.json({ ok: true, synced: rows.length, deleted, sheets: sheetsUpdated });
}
