'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClockIcon } from '@phosphor-icons/react/ssr';
import type { Lead } from '@/lib/sheets';
import { formatTimeHMS, formatDateShort } from '@/lib/date-utils';
import { ease } from '@/lib/dashboard-utils';

type Props = {
  leads: Lead[];
  newLeadIds: Set<number>;
  canFilterByDate: boolean;
};

export const RecentLeads = ({ leads, newLeadIds, canFilterByDate }: Props) => (
  <ul className="mt-2 max-h-72 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
    {leads.length === 0 && (
      <li className="text-xs font-medium text-white/40">Nenhum lead ainda.</li>
    )}
    {leads.map((lead, i) => {
      const isNew = newLeadIds.has(lead.rowIndex);
      return (
        <motion.li
          key={`${lead.rowIndex}-${lead.nome}`}
          initial={{
            opacity: 0,
            x: isNew ? 0 : -10,
            backgroundColor: isNew ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0)',
          }}
          animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
          transition={{
            opacity: { duration: 0.4, delay: isNew ? 0 : 0.3 + i * 0.05, ease },
            x: { duration: 0.4, delay: isNew ? 0 : 0.3 + i * 0.05, ease },
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
                {lead.sobrenome || lead.whatsapp || '—'}
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
            {canFilterByDate ? formatTimeHMS(lead.timestamp) : `#${lead.rowIndex + 1}`}
          </span>
        </motion.li>
      );
    })}
  </ul>
);
