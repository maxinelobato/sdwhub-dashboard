import { NextResponse } from 'next/server';
import { PCE_STATS } from '@/lib/pce-data';

export async function GET() {
  return NextResponse.json(PCE_STATS);
}
