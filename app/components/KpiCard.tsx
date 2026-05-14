'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/dashboard-utils';

export type KpiCardProps = {
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

export const KpiCard = ({
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
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', accent)}>
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
            {delta > 0 ? '+' : ''}{delta}
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
