import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';
import { syncLeadsToSheet } from '@/lib/gsheets';
import type { Lead } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SYMPLA_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sinceParam = req.nextUrl.searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : new Date('2026-05-11');

  const participants = await fetchAllParticipants(since);
  const rows = participants.map(participantToRow);

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, sheets: 0 });
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .upsert(rows, { onConflict: 'sympla_id' });

  if (error) {
    console.error('[sympla/sync] upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    console.error('[sympla/sync] sheets error:', err);
  }

  return NextResponse.json({ ok: true, synced: rows.length, sheets: sheetsUpdated });
}
