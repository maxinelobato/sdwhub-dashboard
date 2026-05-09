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
