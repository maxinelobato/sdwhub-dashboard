'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { DistEntry } from '@/lib/dashboard-utils';
import { ease } from '@/lib/dashboard-utils';

type Props = {
  byUtmSource: DistEntry[];
  byFonte: DistEntry[];
  maxUtm: number;
};

export const DistributionPanel = ({ byUtmSource, byFonte, maxUtm }: Props) => (
  <>
    <ul className="mt-2 space-y-3">
      {byUtmSource.length === 0 && (
        <li className="text-xs font-medium text-white/40">Sem dados no período.</li>
      )}
      {byUtmSource.map((entry, i) => {
        const pct = (entry.count / maxUtm) * 100;
        return (
          <li key={entry.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-white/80">{entry.label}</span>
              <span className="font-black text-brand-cream">{entry.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.35 + i * 0.05, ease }}
                className="h-full rounded-full bg-linear-to-r from-brand-purple via-brand-rose to-brand-cream"
              />
            </div>
          </li>
        );
      })}
    </ul>

    {byFonte.length > 0 && (
      <div className="mt-6 border-t border-white/5 pt-4">
        <span className="mb-3 block text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
          Por fonte
        </span>
        <div className="flex flex-wrap gap-2">
          {byFonte.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold"
            >
              {m.label}
              <span className="font-black text-brand-cream">{m.count}</span>
            </span>
          ))}
        </div>
      </div>
    )}
  </>
);
