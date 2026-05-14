'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ease } from '@/lib/dashboard-utils';

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
};

export const Panel = ({ title, subtitle, children, delay = 0 }: PanelProps) => (
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
