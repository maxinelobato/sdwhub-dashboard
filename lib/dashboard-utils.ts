import type { Lead } from './sheets';
import { rangeFor, startOfDay, addDays } from './date-utils';
import type { PeriodKey } from './date-utils';

export const ease = [0.21, 0.47, 0.32, 0.98] as const;

export type DistEntry = { label: string; count: number };

export function formatPeriodRange(period: PeriodKey, ref: Date): string {
  const range = rangeFor(period, ref);
  if (!range) return 'todos os leads';
  const short = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const full = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (period === 'today' || period === 'yesterday') return full(range.start);
  return `${short(range.start)} – ${short(range.end)}`;
}

export function topBy(leads: Lead[], key: keyof Lead, max = 5): DistEntry[] {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const value = String(lead[key] ?? '').trim();
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label, count]) => ({ label, count }));
}

export function leadsByDay(
  leads: Lead[],
  days: number,
): { day: Date; count: number; label: string }[] {
  const result: { day: Date; count: number; label: string }[] = [];
  const today = startOfDay();
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const next = addDays(day, 1);
    const count = leads.filter(
      (l) =>
        l.timestamp &&
        l.timestamp.getTime() >= day.getTime() &&
        l.timestamp.getTime() < next.getTime(),
    ).length;
    result.push({
      day,
      count,
      label: day
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        .replace('.', ''),
    });
  }
  return result;
}
