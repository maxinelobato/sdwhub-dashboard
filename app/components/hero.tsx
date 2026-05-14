'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  UsersThreeIcon,
  TargetIcon,
  TrendUpIcon,
  TrendDownIcon,
  MinusIcon,
  ArrowsClockwiseIcon,
  WarningCircleIcon,
  ClockIcon,
  BellIcon,
  BellSlashIcon,
} from '@phosphor-icons/react/ssr';
import type { Lead, ParsedLeads } from '@/lib/sheets';
import { supabase } from '@/lib/supabase';
import {
  PERIOD_LABELS,
  PERIOD_ORDER,
  PERIOD_KPI_LABELS,
  PERIOD_GOAL_LABELS,
  isWithin,
  rangeFor,
  prevRangeFor,
  startOfDay,
  addDays,
  formatTimeAgo,
  formatTimeHMS,
  formatDateShort,
  type PeriodKey,
} from '@/lib/date-utils';
import { cn } from '@/lib/utils';

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_SECONDS ?? 10) * 1000;

const ease = [0.21, 0.47, 0.32, 0.98] as const;

function formatPeriodRange(period: PeriodKey, ref: Date): string {
  const range = rangeFor(period, ref);
  if (!range) return 'todos os leads';
  const short = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const full = (d: Date) =>
    d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  if (period === 'today' || period === 'yesterday') return full(range.start);
  return `${short(range.start)} – ${short(range.end)}`;
}

type DistEntry = { label: string; count: number };

function topBy(leads: Lead[], key: keyof Lead, max = 5): DistEntry[] {
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

function leadsByDay(
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

export const Hero = () => {
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [data, setData] = useState<ParsedLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const prevLeadIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);
  const [flashKey, setFlashKey] = useState(0);
  const [newLeadIds, setNewLeadIds] = useState<Set<number>>(new Set());
  const [toastCount, setToastCount] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>('default');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);
  const notifEnabledRef = useRef(false);
  const settingsBtnRef = useRef<HTMLDivElement>(null);

  const dailyGoal = Number(process.env.NEXT_PUBLIC_LEADS_DAILY_GOAL ?? 10);

  const sendLeadNotification = useCallback(async (count: number) => {
    if (!notifEnabledRef.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const title = count === 1 ? 'Novo lead! 🎉' : `${count} novos leads! 🎉`;
    const body =
      count === 1
        ? 'Um novo lead chegou no SDW.hub 2026.'
        : `${count} novos leads chegaram no SDW.hub 2026.`;
    const icon = '/images/sdw-logo-purple.png';
    try {
      if (swRegRef.current) {
        await swRegRef.current.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: 'new-lead',
          renotify: true,
          vibrate: [200, 100, 200],
        } as NotificationOptions & { renotify: boolean; vibrate: number[] });
      } else {
        new Notification(title, { body, icon });
      }
    } catch {
      /* notificação não disponível */
    }
  }, []);

  const handleToggleNotif = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!notifEnabled) {
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        setNotifPermission(result);
        if (result !== 'granted') return;
      }
      setNotifEnabled(true);
    } else {
      setNotifEnabled(false);
    }
  }, [notifEnabled]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/leads', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Falha ao sincronizar (${res.status})`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const parsed: ParsedLeads = {
        ...json,
        fetchedAt: new Date(json.fetchedAt),
        leads: (
          json.leads as (Omit<Lead, 'timestamp'> & {
            timestamp: string | null;
          })[]
        ).map((l) => ({
          ...l,
          timestamp: l.timestamp ? new Date(l.timestamp) : null,
        })),
      };
      setData(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      load();
      setNow(new Date());
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          load();
          setNow(new Date());
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const allIds = new Set(data.leads.map((l) => l.rowIndex));
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevLeadIdsRef.current = allIds;
      return;
    }
    const newIds = new Set(
      [...allIds].filter((id) => !prevLeadIdsRef.current.has(id)),
    );
    prevLeadIdsRef.current = allIds;
    if (newIds.size === 0) return;
    setFlashKey((k) => k + 1);
    setNewLeadIds(newIds);
    setToastCount(newIds.size);
    sendLeadNotification(newIds.size);
    const t = setTimeout(() => {
      setNewLeadIds(new Set());
      setToastCount(0);
    }, 4000);
    return () => clearTimeout(t);
  }, [data, sendLeadNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('sdwhub-notif-enabled') === 'true';
    setNotifEnabled(saved);
    notifEnabledRef.current = saved;
    if ('Notification' in window) setNotifPermission(Notification.permission);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          swRegRef.current = reg;
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    notifEnabledRef.current = notifEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdwhub-notif-enabled', String(notifEnabled));
    }
  }, [notifEnabled]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  const hasTimestamp = data?.hasTimestamp ?? false;
  const withTimestamp = data?.withTimestamp ?? 0;
  const total = data?.totalRows ?? 0;
  /** Coluna Timestamp existe MAS nenhuma linha tem valor — precisa backfill. */
  const timestampEmpty = hasTimestamp && total > 0 && withTimestamp === 0;
  /** Pode usar filtros por período de fato (coluna existe + ao menos 1 linha preenchida). */
  const canFilterByDate = hasTimestamp && withTimestamp > 0;
  /** Cobertura completa: todos os leads têm timestamp — todayCount usa filtro real. */
  const hasFullCoverage = hasTimestamp && total > 0 && withTimestamp >= total;

  const primaryLeads = useMemo(() => {
    if (!data) return [];
    const range = rangeFor(period, now);
    return data.leads.filter((l) => isWithin(l.timestamp, range));
  }, [data, now, period]);

  const compareLeads = useMemo(() => {
    if (!data) return [];
    const range = prevRangeFor(period, now);
    if (!range) return [];
    return data.leads.filter(
      (l) => l.timestamp !== null && isWithin(l.timestamp, range),
    );
  }, [data, now, period]);

  const primaryCount = hasFullCoverage ? primaryLeads.length : total;
  const compareCount = compareLeads.length;
  const trend: 'up' | 'down' | 'flat' =
    primaryCount > compareCount
      ? 'up'
      : primaryCount < compareCount
        ? 'down'
        : 'flat';
  const TrendIcon =
    trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : MinusIcon;
  const trendDelta = primaryCount - compareCount;

  const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : 1;
  const periodGoal = dailyGoal * periodDays;
  const goalProgress =
    periodGoal > 0 ? Math.min(100, (primaryCount / periodGoal) * 100) : 0;

  const last7 = useMemo(() => leadsByDay(data?.leads ?? [], 7), [data]);
  const maxBar = Math.max(1, ...last7.map((d) => d.count));

  const recent = useMemo(() => {
    return (data?.leads ?? []).slice().sort((a, b) => b.rowIndex - a.rowIndex);
  }, [data]);

  const byFaturamento = useMemo(
    () =>
      topBy(
        primaryLeads.length ? primaryLeads : (data?.leads ?? []),
        'faturamento',
        5,
      ),
    [primaryLeads, data],
  );
  const byMercado = useMemo(
    () =>
      topBy(
        primaryLeads.length ? primaryLeads : (data?.leads ?? []),
        'mercado',
        5,
      ),
    [primaryLeads, data],
  );
  const maxFat = Math.max(1, ...byFaturamento.map((e) => e.count));

  return (
    <>
      <AnimatePresence>
        {toastCount > 0 && (
          <motion.div
            key={flashKey}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-none fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3 text-white shadow-2xl shadow-emerald-500/40"
          >
            <UsersThreeIcon size={18} weight="bold" />
            <span className="text-sm font-black">
              +{toastCount} novo{toastCount > 1 ? 's' : ''} lead
              {toastCount > 1 ? 's' : ''}!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <section className="relative min-h-screen overflow-hidden bg-brand-dark-blue px-6 py-8 text-white md:px-10 md:py-10">
        {/* Background Desktop */}
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden scale-110 bg-cover bg-center md:block"
          style={{ backgroundImage: 'url(/images/desktop.JPG)' }}
        >
          <div className="absolute inset-0 bg-brand-dark-blue/30 backdrop-blur-sm" />
        </div>

        {/* Background Mobile */}
        <div
          className="pointer-events-none absolute inset-0 z-0 block scale-110 bg-cover bg-center md:hidden"
          style={{ backgroundImage: 'url(/images/mobile.JPG)' }}
        >
          <div className="absolute inset-0 bg-brand-dark-blue/30 backdrop-blur-sm" />
        </div>

        <div className="relative z-10">
          <header className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/images/sdw-logo-gold.png"
                alt="SDW.hub"
                width={56}
                height={56}
                priority
                className="h-12 w-auto"
              />
              <div>
                <span className="block text-[10px] font-black tracking-[0.3em] text-brand-cream uppercase">
                  SDW.hub 2026 | Dashboard Em Tempo Real
                </span>
                <h1 className="font-display text-2xl font-black tracking-tighter uppercase md:text-3xl">
                  Leads Meta Ads
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Filtro de período"
                className="flex w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 [scrollbar-width:none] md:w-auto [&::-webkit-scrollbar]:hidden"
              >
                {PERIOD_ORDER.map((p) => {
                  const active = period === p;
                  return (
                    <button
                      key={p}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        'relative shrink-0 rounded-full px-4 py-2 text-[10px] font-black tracking-[0.18em] uppercase transition-colors',
                        active
                          ? 'text-brand-dark-blue'
                          : 'text-white/60 hover:text-white',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="period-pill"
                          className="absolute inset-0 rounded-full bg-brand-cream"
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex flex-col items-center gap-px leading-tight">
                        <span>{PERIOD_LABELS[p]}</span>
                        <span className="text-[7px] font-bold tracking-wide normal-case opacity-60">
                          {formatPeriodRange(p, now)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div ref={settingsBtnRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen((o) => !o);
                    if (
                      typeof window !== 'undefined' &&
                      'Notification' in window
                    ) {
                      setNotifPermission(Notification.permission);
                    }
                  }}
                  aria-label="Configurações de notificação"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-colors',
                    notifEnabled && notifPermission === 'granted'
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white',
                  )}
                >
                  {notifEnabled && notifPermission === 'granted' ? (
                    <BellIcon size={12} weight="bold" />
                  ) : (
                    <BellSlashIcon size={12} weight="bold" />
                  )}
                  <span className="hidden sm:inline">Notificações</span>
                </button>

                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                      className="absolute top-full right-0 z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0d0d1f] p-4 shadow-2xl"
                    >
                      <p className="mb-4 text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
                        Configurações
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white">
                            Notificações de leads
                          </p>
                          <p className="mt-0.5 text-[10px] leading-relaxed font-medium text-white/40">
                            {typeof window !== 'undefined' &&
                            !('Notification' in window)
                              ? 'Não suportado neste browser.'
                              : notifPermission === 'denied'
                                ? 'Bloqueado. Habilite nas configurações do site.'
                                : notifPermission === 'granted'
                                  ? notifEnabled
                                    ? 'Alertas de novos leads ativados.'
                                    : 'Alertas desativados.'
                                  : 'Clique para ativar e permitir alertas.'}
                          </p>
                        </div>

                        <button
                          role="switch"
                          aria-checked={
                            notifEnabled && notifPermission === 'granted'
                          }
                          onClick={handleToggleNotif}
                          disabled={notifPermission === 'denied'}
                          className={cn(
                            'relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200',
                            notifEnabled && notifPermission === 'granted'
                              ? 'bg-emerald-500'
                              : notifPermission === 'denied'
                                ? 'cursor-not-allowed bg-white/10 opacity-50'
                                : 'bg-white/20 hover:bg-white/30',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                              notifEnabled && notifPermission === 'granted'
                                ? 'translate-x-5'
                                : 'translate-x-0',
                            )}
                          />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-colors hover:bg-brand-purple-dark disabled:opacity-60"
              >
                <motion.span
                  animate={loading ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    loading
                      ? { repeat: Infinity, duration: 1, ease: 'linear' }
                      : undefined
                  }
                >
                  <ArrowsClockwiseIcon size={12} weight="bold" />
                </motion.span>
                Atualizar
              </button>
            </div>
          </header>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-rose-200"
              >
                <WarningCircleIcon size={18} weight="duotone" />
                <span className="text-xs font-semibold">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!hasTimestamp && data && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-amber-200">
              <WarningCircleIcon size={18} weight="duotone" />
              <span className="text-xs font-semibold">
                Adicione a coluna <code className="font-mono">Timestamp</code>{' '}
                na planilha para liberar filtros por período. Métricas exibem o
                total geral até lá.
              </span>
            </div>
          )}

          {timestampEmpty && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-amber-200">
              <WarningCircleIcon
                size={20}
                weight="duotone"
                className="mt-0.5 shrink-0"
              />
              <div className="space-y-2 text-xs leading-relaxed font-semibold">
                <p>
                  Coluna{' '}
                  <code className="rounded bg-white/10 px-1 font-mono">
                    Timestamp
                  </code>{' '}
                  detectada, mas todas as {total} linhas estão sem data —
                  filtros por dia estão desativados.
                </p>
                <p className="text-white/80">
                  Corrija em <strong>uma</strong> das formas abaixo:
                </p>
                <ol className="list-inside list-decimal space-y-1 font-normal text-white/70">
                  <li>
                    <strong className="text-white/90">Typebot (ideal):</strong>{' '}
                    no bloco Google Sheets, adicione o campo{' '}
                    <code className="rounded bg-white/10 px-1 font-mono">
                      Timestamp
                    </code>{' '}
                    com o valor{' '}
                    <code className="rounded bg-white/10 px-1 font-mono">
                      {'{{now}}'}
                    </code>
                    .
                  </li>
                  <li>
                    <strong className="text-white/90">
                      Apps Script (automático):
                    </strong>{' '}
                    na planilha, vá em Extensões → Apps Script, cole o código
                    abaixo e execute{' '}
                    <code className="rounded bg-white/10 px-1 font-mono">
                      setup()
                    </code>{' '}
                    uma vez:
                  </li>
                </ol>
                <pre className="mt-1 overflow-x-auto rounded bg-black/30 p-2 font-mono text-[10px] leading-relaxed whitespace-pre text-white/60">{`function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('fillMissing').forSpreadsheet(SpreadsheetApp.getActive()).onChange().create();
  ScriptApp.newTrigger('fillMissing').timeBased().everyMinutes(1).create();
  fillMissing();
}
function fillMissing() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const last = sh.getLastRow();
  if (last < 2) return;
  const rng = sh.getRange(2, 1, last - 1, 1);
  const vals = rng.getValues();
  const now = new Date();
  let changed = false;
  vals.forEach(r => { if (!r[0]) { r[0] = now; changed = true; } });
  if (changed) rng.setValues(vals);
}`}</pre>
              </div>
            </div>
          )}

          {/* KPI Row */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label={PERIOD_KPI_LABELS[period].main}
              value={primaryCount}
              subValue={formatPeriodRange(period, now)}
              icon={<UsersThreeIcon size={18} weight="bold" />}
              accent="bg-brand-purple"
              loading={loading && !data}
              delay={0}
              flash={toastCount > 0}
            />
            <KpiCard
              label={PERIOD_KPI_LABELS[period].compare}
              value={`${primaryCount}`}
              subValue={
                canFilterByDate && period !== 'all'
                  ? `Período anterior: ${compareCount}`
                  : timestampEmpty
                    ? 'Backfill pendente'
                    : 'Sem coluna de data'
              }
              icon={<TrendIcon size={18} weight="bold" />}
              accent={
                trend === 'up'
                  ? 'bg-emerald-500'
                  : trend === 'down'
                    ? 'bg-rose-500'
                    : 'bg-white/20'
              }
              delta={
                canFilterByDate && period !== 'all' ? trendDelta : undefined
              }
              loading={loading && !data}
              delay={0.05}
            />
            <KpiCard
              label={PERIOD_GOAL_LABELS[period]}
              value={`${primaryCount}/${periodGoal}`}
              subValue={`${goalProgress.toFixed(0)}% concluído`}
              icon={<TargetIcon size={18} weight="bold" />}
              accent="bg-brand-cream text-brand-dark-blue"
              progress={goalProgress}
              loading={loading && !data}
              delay={0.1}
            />
          </div>

          {/* Bottom row: 3 panels */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Bar chart - Leads / day */}
            <Panel
              title="Leads / dia"
              subtitle={formatPeriodRange('7d', now)}
              delay={0.2}
            >
              {!canFilterByDate ? (
                <p className="text-xs leading-relaxed font-medium text-white/40">
                  {timestampEmpty
                    ? 'Coluna Timestamp vazia — preencha as linhas para ativar o histórico diário.'
                    : 'Adicione a coluna Timestamp para visualizar o histórico diário.'}
                </p>
              ) : (
                <div className="mt-4 flex h-40 items-end justify-between gap-2">
                  {last7.map((d) => {
                    const heightPct = (d.count / maxBar) * 100;
                    return (
                      <div
                        key={d.day.toISOString()}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div className="relative flex w-full flex-1 items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.8, ease, delay: 0.3 }}
                            className="min-h-[2px] w-full rounded-t-md bg-gradient-to-t from-brand-purple to-brand-cream"
                          />
                          {d.count > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-brand-cream">
                              {d.count}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-black tracking-wider text-white/40 uppercase">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            {/* Recently created */}
            <Panel
              title="Leads recentes"
              subtitle="Ordenados por chegada"
              delay={0.25}
            >
              <ul className="mt-2 max-h-72 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                {recent.length === 0 && (
                  <li className="text-xs font-medium text-white/40">
                    Nenhum lead ainda.
                  </li>
                )}
                {recent.map((lead, i) => {
                  const isNew = newLeadIds.has(lead.rowIndex);
                  return (
                    <motion.li
                      key={`${lead.rowIndex}-${lead.nome}`}
                      initial={{
                        opacity: 0,
                        x: isNew ? 0 : -10,
                        backgroundColor: isNew
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(0,0,0,0)',
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor: 'rgba(0,0,0,0)',
                      }}
                      transition={{
                        opacity: {
                          duration: 0.4,
                          delay: isNew ? 0 : 0.3 + i * 0.05,
                          ease,
                        },
                        x: {
                          duration: 0.4,
                          delay: isNew ? 0 : 0.3 + i * 0.05,
                          ease,
                        },
                        backgroundColor: { duration: 3, ease: 'easeOut' },
                      }}
                      className="-mx-1 flex items-center justify-between gap-3 rounded-lg border-b border-white/5 px-1 pb-3 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate text-sm font-bold text-white">
                            {lead.nome || '—'}
                          </p>
                          {lead.timestamp && (
                            <span className="shrink-0 text-[9px] font-bold text-white/30">
                              {formatDateShort(lead.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <p className="truncate text-[11px] font-medium text-white/40">
                            {lead.redeSocial || lead.email || '—'}
                          </p>
                          {lead.utmSource && (
                            <span className="inline-flex items-center rounded-full bg-brand-purple/20 px-1.5 py-px text-[8px] font-black tracking-wider text-brand-purple uppercase">
                              {lead.utmSource}
                            </span>
                          )}
                          {lead.utmContent && (
                            <span className="inline-flex items-center rounded-full bg-brand-rose/20 px-1.5 py-px text-[8px] font-black tracking-wider text-brand-rose uppercase">
                              {lead.utmContent}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider whitespace-nowrap text-brand-cream uppercase">
                        <ClockIcon size={11} weight="bold" />
                        {canFilterByDate
                          ? formatTimeHMS(lead.timestamp)
                          : `#${lead.rowIndex + 1}`}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </Panel>

            {/* Distribution by faturamento */}
            <Panel
              title="Por faturamento"
              subtitle={`${primaryCount} leads · ${PERIOD_LABELS[period]} · ${formatPeriodRange(period, now)}`}
              delay={0.3}
            >
              <ul className="mt-2 space-y-3">
                {byFaturamento.length === 0 && (
                  <li className="text-xs font-medium text-white/40">
                    Sem dados no período.
                  </li>
                )}
                {byFaturamento.map((entry, i) => {
                  const pct = (entry.count / maxFat) * 100;
                  return (
                    <li key={entry.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-white/80">
                          {entry.label}
                        </span>
                        <span className="font-black text-brand-cream">
                          {entry.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.35 + i * 0.05,
                            ease,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-brand-purple via-brand-rose to-brand-cream"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {byMercado.length > 0 && (
                <div className="mt-6 border-t border-white/5 pt-4">
                  <span className="mb-3 block text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
                    Top mercados
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {byMercado.map((m) => (
                      <span
                        key={m.label}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold"
                      >
                        {m.label}
                        <span className="font-black text-brand-cream">
                          {m.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <footer className="mt-6 flex flex-col items-center justify-between gap-2 text-[10px] font-black tracking-[0.3em] text-white/30 uppercase sm:flex-row">
            <span>Total geral: {total} leads</span>
            <span>Sincronização automática a cada {REFRESH_MS / 1000}s</span>
            <span>
              Última atualização:{' '}
              <span className="text-brand-cream">
                {formatTimeAgo(data?.fetchedAt ?? null, now)}
              </span>
            </span>
          </footer>
        </div>
      </section>
    </>
  );
};

type KpiCardProps = {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  accent?: string;
  bgClass?: string;
  delta?: number;
  progress?: number;
  loading?: boolean;
  delay?: number;
  flash?: boolean;
};

const KpiCard = ({
  label,
  value,
  subValue,
  icon,
  accent = 'bg-brand-purple',
  bgClass,
  delta,
  progress,
  loading,
  delay = 0,
  flash = false,
}: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease }}
    className={cn(
      flash ? 'shimmer-border-green' : 'shimmer-border',
      'relative rounded-2xl p-[1.5px]',
    )}
  >
    <div className="relative h-full overflow-hidden rounded-[14px] bg-[#1d1b3f] p-5">
      {bgClass && (
        <div className={cn('pointer-events-none absolute inset-0', bgClass)} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              accent,
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'font-display text-4xl leading-none font-black tracking-tighter md:text-5xl',
            loading && 'animate-pulse opacity-40',
          )}
        >
          {value}
        </span>
        {typeof delta === 'number' && delta !== 0 && (
          <span
            className={cn(
              'text-[10px] font-black tracking-wider',
              delta > 0 ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </div>

      {subValue && (
        <p className="mt-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
          {subValue}
        </p>
      )}

      {typeof progress === 'number' && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease }}
            className="h-full rounded-full bg-brand-cream"
          />
        </div>
      )}
    </div>
  </motion.div>
);

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
};

const Panel = ({ title, subtitle, children, delay = 0 }: PanelProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease }}
    className="shimmer-border relative rounded-2xl p-[1.5px]"
  >
    <div className="h-full rounded-[14px] bg-[#1d1b3f] p-5">
      <div className="mb-2">
        <h3 className="font-display text-base font-black tracking-tighter uppercase">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  </motion.div>
);
