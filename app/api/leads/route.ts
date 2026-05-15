import { NextResponse } from 'next/server';
import type { Lead } from '@/lib/sheets';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { DEFAULT_EVENT_ID, type EventId } from '@/lib/event-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = (searchParams.get('event') ?? DEFAULT_EVENT_ID) as EventId;
    const supabase = getSupabaseAdmin(eventId);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('data_compra', { ascending: true });

    if (error) throw new Error(error.message);

    const leads: Lead[] = (data ?? []).map((row, i) => ({
      rowIndex: i,
      timestamp: row.data_compra ? new Date(row.data_compra) : null,
      ordemInscricao: row.ordem_inscricao ?? undefined,
      nome: row.nome ?? '',
      sobrenome: row.sobrenome ?? '',
      whatsapp: row.whatsapp ?? '',
      utmSource: row.utm_source ?? '',
      utmCampaign: row.utm_campaign ?? '',
      utmContent: row.utm_content ?? '',
      utmTerm: row.utm_term ?? '',
      fonte: row.fonte ?? '',
      raw: {},
    }));

    return NextResponse.json(
      {
        leads: leads.map((l) => ({
          ...l,
          timestamp: l.timestamp?.toISOString() ?? null,
        })),
        hasTimestamp: leads.some((l) => l.timestamp !== null),
        withTimestamp: leads.filter((l) => l.timestamp !== null).length,
        totalRows: leads.length,
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
