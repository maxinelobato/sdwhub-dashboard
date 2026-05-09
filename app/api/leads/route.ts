import { NextResponse } from 'next/server';
import { fetchLeads } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchLeads();
    return NextResponse.json(
      {
        leads: data.leads.map((l) => ({
          ...l,
          timestamp: l.timestamp?.toISOString() ?? null,
        })),
        hasTimestamp: data.hasTimestamp,
        withTimestamp: data.withTimestamp,
        totalRows: data.totalRows,
        fetchedAt: data.fetchedAt.toISOString(),
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
