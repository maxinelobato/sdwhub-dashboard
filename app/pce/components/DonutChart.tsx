'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Entry = { label: string; count: number };

type Props = {
  data: Entry[];
  total: number;
  colors?: string[];
  innerLabel?: string;
};

const DEFAULT_COLORS = [
  '#7c5cbf', // brand-purple
  '#2dd4bf', // teal-400
  '#f59e0b', // amber-400
  '#94a3b8', // slate-400
  '#10b981', // emerald-500
  '#f43f5e', // rose-500
  '#60a5fa', // blue-400
  '#e2d5b0', // brand-cream
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { pct: number } }[] }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d1f] px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{item.name}</p>
      <p className="text-brand-cream font-black">
        {item.value} <span className="font-normal text-white/50">({item.payload.pct}%)</span>
      </p>
    </div>
  );
};

const CustomLegend = ({ payload }: { payload?: { color: string; value: string; payload: { count: number; pct: number } }[] }) => {
  if (!payload) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[9px] font-bold text-white/60 leading-tight">
            {entry.value} <span className="text-brand-cream">({entry.payload.count})</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export const DonutChart = ({ data, total, colors = DEFAULT_COLORS, innerLabel }: Props) => {
  const chartData = data.map((d) => ({
    name: d.label,
    value: d.count,
    count: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <div className="mt-2">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      {innerLabel && (
        <p className="mt-1 text-center text-[9px] font-black tracking-widest text-white/30 uppercase">
          {innerLabel}
        </p>
      )}
    </div>
  );
};
