'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import type { PCEParticipant } from '@/lib/pce-participants';
import { cn } from '@/lib/utils';

type Props = { participants: PCEParticipant[] };

const PAGE_SIZE = 20;

const FASE_CONFIG: Record<string, { short: string; cls: string }> = {
  'Empresa em crescimento acelerado': {
    short: 'Acelerado',
    cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  'Empresa estruturando crescimento': {
    short: 'Estruturando',
    cls: 'bg-brand-purple/30 text-purple-300 border-purple-500/30',
  },
  'Já vendo, mas ainda instável': {
    short: 'Instável',
    cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  'Ideia / começando agora': {
    short: 'Ideia',
    cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
  'Empresa consolidada / escalando': {
    short: 'Consolidado',
    cls: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  },
};

function FaseBadge({ fase }: { fase: string }) {
  const cfg = FASE_CONFIG[fase];
  if (!cfg) return <span className="text-[10px] text-white/30">—</span>;
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
        cfg.cls,
      )}
    >
      {cfg.short}
    </span>
  );
}

function ClarezaBadge({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-[10px] text-white/30">—</span>;
  const cls =
    value <= 1
      ? 'bg-rose-500/20 text-rose-400'
      : value <= 3
        ? 'bg-amber-500/20 text-amber-400'
        : 'bg-emerald-500/20 text-emerald-400';
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black',
        cls,
      )}
    >
      {value}
    </span>
  );
}

export const ParticipantsTable = ({ participants }: Props) => {
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.empresa.toLowerCase().includes(q) ||
        p.segmento.toLowerCase().includes(q) ||
        p.cidade.toLowerCase().includes(q),
    );
  }, [participants, query]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query]);

  const loadMore = useCallback(() => {
    setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  // IntersectionObserver: load next page when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const rows = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={14}
          weight="bold"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, empresa, segmento ou cidade…"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-8 text-xs text-white placeholder-white/30 outline-none focus:border-brand-cream/30"
        />
        {query && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-black text-white/30">
            {filtered.length}/{participants.length}
          </span>
        )}
      </div>

      {/* Scrollable container */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        {/* Fixed-height scroll area — thead stays sticky */}
        <div className="max-h-130 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
          <table className="w-full min-w-160 text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/10 bg-[#1d1b3f]">
                <th className="px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  #
                </th>
                <th className="px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  Nome
                </th>
                <th className="px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  Empresa
                </th>
                <th className="hidden px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase md:table-cell">
                  Segmento
                </th>
                <th className="hidden px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase lg:table-cell">
                  Cidade
                </th>
                <th className="px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  Fase
                </th>
                <th className="hidden px-3 py-2 text-[9px] font-black tracking-[0.2em] text-white/40 uppercase md:table-cell">
                  Faturamento
                </th>
                <th className="px-3 py-2 text-center text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  Clareza
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={`${p.nome}-${i}`}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
                >
                  <td className="px-3 py-2 text-[10px] font-bold text-white/20">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[11px] font-bold text-white/90">
                      {p.nome || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-medium text-white/60">
                      {p.empresa &&
                      p.empresa.toLowerCase() !== 'ainda não tenho' &&
                      p.empresa.toLowerCase() !== 'não tenho empresa' ? (
                        p.empresa
                      ) : (
                        <span className="text-white/20 italic">—</span>
                      )}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">
                    <span className="text-[10px] font-medium text-white/60">
                      {p.segmento || '—'}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 lg:table-cell">
                    <span className="text-[10px] font-medium text-white/50">
                      {p.cidade || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <FaseBadge fase={p.fase} />
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">
                    <span className="text-[10px] font-medium text-white/60">
                      {p.faturamento || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <ClarezaBadge value={p.clareza} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs font-medium text-white/30">
              Nenhum participante encontrado para &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* Sentinel — observed by IntersectionObserver to trigger loadMore */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center gap-2 py-4"
            >
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/20 [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/20 [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/20 [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>

      {/* Counter */}
      <p className="text-right text-[9px] font-bold tracking-wider text-white/20 uppercase">
        {rows.length} de {filtered.length} participante
        {filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};
