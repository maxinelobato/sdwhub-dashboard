import { NextResponse } from 'next/server';
import { fetchLeads, type Lead } from '@/lib/sheets';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchSymplaLeads(offset: number): Promise<Lead[]> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('source', 'sympla')
    .order('timestamp', { ascending: true });

  if (error || !data) return [];

  return data.map((row, i) => ({
    rowIndex: offset + i + 1,
    timestamp: row.timestamp ? new Date(row.timestamp) : null,
    nome: row.nome ?? '',
    whatsapp: row.whatsapp ?? '',
    email: row.email ?? '',
    redeSocial: row.rede_social ?? '',
    atuacao: row.atuacao ?? '',
    mercado: row.mercado ?? '',
    emOperacao: row.em_operacao ?? '',
    faturamento: row.faturamento ?? '',
    tamanhoEquipe: row.tamanho_equipe ?? '',
    objetivo: row.objetivo ?? '',
    pretendeParticipar: row.pretende_participar ?? '',
    motivacao: row.motivacao ?? '',
    utmSource: row.utm_source ?? '',
    utmContent: row.utm_content ?? '',
    raw: {},
  }));
}

export async function GET() {
  try {
    const [sheetsData, symplaLeads] = await Promise.all([
      fetchLeads(),
      fetchSymplaLeads(0).catch(() => [] as Lead[]),
    ]);

    const symplaWithOffset = symplaLeads.map((l, i) => ({
      ...l,
      rowIndex: sheetsData.totalRows + i + 1,
    }));

    const allLeads = [...sheetsData.leads, ...symplaWithOffset];

    return NextResponse.json(
      {
        leads: allLeads.map((l) => ({
          ...l,
          timestamp: l.timestamp?.toISOString() ?? null,
        })),
        hasTimestamp:
          sheetsData.hasTimestamp ||
          symplaLeads.some((l) => l.timestamp !== null),
        withTimestamp: allLeads.filter((l) => l.timestamp !== null).length,
        totalRows: allLeads.length,
        fetchedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
