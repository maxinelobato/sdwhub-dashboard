import type { Metadata } from 'next';
import { PCE_STATS } from '@/lib/pce-data';
import { PCE_PARTICIPANTS } from '@/lib/pce-participants';
import { PCEDashboard } from './components/PCEDashboard';

export const metadata: Metadata = {
  title: 'SDW.hub | PCE — Diagnóstico Empresarial',
  description:
    'Dashboard de diagnóstico do Programa de Crescimento Empresarial',
  robots: { index: false, follow: false },
};

export default function PCEPage() {
  return <PCEDashboard data={PCE_STATS} participants={PCE_PARTICIPANTS} />;
}
