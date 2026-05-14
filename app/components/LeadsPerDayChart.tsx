'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ease } from '@/lib/dashboard-utils';

type DayEntry = { day: Date; count: number; label: string };

type Props = {
  data: DayEntry[];
  maxBar: number;
  canFilterByDate: boolean;
  timestampEmpty: boolean;
};

export const LeadsPerDayChart = ({ data, maxBar, canFilterByDate, timestampEmpty }: Props) => {
  if (!canFilterByDate) {
    return (
      <p className="text-xs leading-relaxed font-medium text-white/40">
        {timestampEmpty
          ? 'Coluna Timestamp vazia — preencha as linhas para ativar o histórico diário.'
          : 'Adicione a coluna Timestamp para visualizar o histórico diário.'}
      </p>
    );
  }

  return (
    <div className="mt-4 flex h-40 items-end justify-between gap-2">
      {data.map((d) => {
        const heightPct = (d.count / maxBar) * 100;
        return (
          <div key={d.day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
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
  );
};
