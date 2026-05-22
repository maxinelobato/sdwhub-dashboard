'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ease } from '@/lib/dashboard-utils';

type Entry = { label: string; count: number };

type Props = {
  data: Entry[];
  total: number;
  color?: string;
  maxItems?: number;
  showPercentage?: boolean;
  labelTruncate?: number;
};

export const HBarChart = ({
  data,
  total,
  color = 'bg-brand-purple',
  maxItems = 6,
  showPercentage = true,
  labelTruncate = 28,
}: Props) => {
  const items = data.slice(0, maxItems);
  const max = Math.max(1, ...items.map((e) => e.count));

  if (items.length === 0) {
    return (
      <p className="mt-3 text-xs font-medium text-white/30">Sem dados disponíveis.</p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {items.map((entry, i) => {
        const pct = (entry.count / max) * 100;
        const share = total > 0 ? Math.round((entry.count / total) * 100) : 0;
        const label =
          entry.label.length > labelTruncate
            ? entry.label.slice(0, labelTruncate) + '…'
            : entry.label;
        return (
          <div key={entry.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold leading-tight text-white/70">{label}</span>
              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] font-black text-brand-cream">{entry.count}</span>
                {showPercentage && (
                  <span className="text-[9px] font-bold text-white/30">{share}%</span>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.05, ease }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
