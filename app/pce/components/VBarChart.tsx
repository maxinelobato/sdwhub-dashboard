'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ease } from '@/lib/dashboard-utils';

type Entry = { label: string; count: number };

type Props = {
  data: Entry[];
  gradientFrom?: string;
  gradientTo?: string;
};

export const VBarChart = ({
  data,
  gradientFrom = 'from-brand-purple',
  gradientTo = 'to-brand-cream',
}: Props) => {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="mt-4 flex h-36 items-end justify-between gap-2">
      {data.map((d, i) => {
        const heightPct = (d.count / max) * 100;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.7, ease, delay: i * 0.06 }}
                className={`min-h-[2px] w-full rounded-t-md bg-gradient-to-t ${gradientFrom} ${gradientTo}`}
              />
              {d.count > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-brand-cream">
                  {d.count}
                </span>
              )}
            </div>
            <span className="text-[9px] font-black tracking-wider text-white/40">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};
