import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { participantToRow, type SymplaParticipant } from '@/lib/sympla';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token =
    req.headers.get('s_token') ??
    req.nextUrl.searchParams.get('s_token');

  if (!token || token !== process.env.SYMPLA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body as {
    data?: {
      order?: { utm?: { utm_source?: string; utm_campaign?: string; utm_content?: string; utm_term?: string } };
      participants?: SymplaParticipant[];
    };
  };

  const participants = payload?.data?.participants ?? [];
  const orderUtm = payload?.data?.order?.utm ?? {};

  if (participants.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const rows = participants.map((p) =>
    participantToRow({
      ...p,
      utm_source:   orderUtm.utm_source?.trim()   ?? '',
      utm_campaign: orderUtm.utm_campaign?.trim() ?? '',
      utm_content:  orderUtm.utm_content?.trim()  ?? '',
      utm_term:     orderUtm.utm_term?.trim()     ?? '',
    }),
  );

  const { error } = await supabaseAdmin
    .from('leads')
    .upsert(rows, { onConflict: 'sympla_id' });

  if (error) {
    console.error('[sympla/webhook] upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length });
}
