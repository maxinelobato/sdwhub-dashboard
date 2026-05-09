export type PeriodKey = 'today' | 'yesterday' | '7d' | '14d' | 'all';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '7d': '7 dias',
  '14d': '14 dias',
  all: 'Todo o período',
};

export const PERIOD_ORDER: PeriodKey[] = ['today', 'yesterday', '7d', '14d', 'all'];

/** Início do dia local (00:00:00.000). */
export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Fim do dia local (23:59:59.999). */
export function endOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export type DateRange = { start: Date; end: Date };

export function rangeFor(period: PeriodKey, ref: Date = new Date()): DateRange | null {
  const today = startOfDay(ref);
  switch (period) {
    case 'today':
      return { start: today, end: endOfDay(ref) };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { start: yesterday, end: endOfDay(yesterday) };
    }
    case '7d':
      return { start: addDays(today, -6), end: endOfDay(ref) };
    case '14d':
      return { start: addDays(today, -13), end: endOfDay(ref) };
    case 'all':
      return null;
  }
}

export function isWithin(d: Date | null, range: DateRange | null): boolean {
  if (!range) return true;
  if (!d) return false;
  const t = d.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function formatDateTimeBR(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeHMS(d: Date | null): string {
  if (!d) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const PERIOD_KPI_LABELS: Record<PeriodKey, { main: string; compare: string }> = {
  today:     { main: 'Leads Hoje',       compare: 'Hoje vs. Ontem' },
  yesterday: { main: 'Leads de Ontem',   compare: 'Ontem vs. Anteontem' },
  '7d':      { main: 'Leads — 7 dias',   compare: '7 dias vs. 7 anteriores' },
  '14d':     { main: 'Leads — 14 dias',  compare: '14 dias vs. 14 anteriores' },
  all:       { main: 'Total de Leads',   compare: 'Total Geral' },
};

export const PERIOD_GOAL_LABELS: Record<PeriodKey, string> = {
  today:     'Meta diária',
  yesterday: 'Meta de ontem',
  '7d':      'Meta semanal',
  '14d':     'Meta quinzenal',
  all:       'Meta total',
};

/** Returns the date range immediately before the given period. Returns null for 'all'. */
export function prevRangeFor(period: PeriodKey, ref: Date = new Date()): DateRange | null {
  const today = startOfDay(ref);
  switch (period) {
    case 'today': {
      const d = addDays(today, -1);
      return { start: d, end: endOfDay(d) };
    }
    case 'yesterday': {
      const d = addDays(today, -2);
      return { start: d, end: endOfDay(d) };
    }
    case '7d':
      return { start: addDays(today, -13), end: endOfDay(addDays(today, -7)) };
    case '14d':
      return { start: addDays(today, -27), end: endOfDay(addDays(today, -14)) };
    case 'all':
      return null;
  }
}

export function formatTimeAgo(d: Date | null, now: Date = new Date()): string {
  if (!d) return '—';
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora há pouco';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}
