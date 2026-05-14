import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllParticipants, participantToRow } from '@/lib/sympla';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SYMPLA_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const participants = await fetchAllParticipants();
  const rows = participants.map(participantToRow);

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, synced: 0 });
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .upsert(rows, { onConflict: 'sympla_id' });

  if (error) {
    console.error('[sympla/sync] upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, synced: rows.length });
}
