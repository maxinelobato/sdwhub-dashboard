'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

type Entry = { label: string; count: number };

type Props = {
  data: Entry[];
  colors?: string[];
  height?: number;
};

const DEFAULT_COLORS = [
  '#7c5cbf',
  '#7c5cbf',
  '#7c5cbf',
  '#e2d5b0',
  '#2dd4bf',
  '#10b981',
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d1f] px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white/70">Nível {label}</p>
      <p className="font-black text-brand-cream">{payload[0].value} respondentes</p>
    </div>
  );
};

export const ReColumnChart = ({ data, colors = DEFAULT_COLORS, height = 180 }: Props) => {
  return (
    <div className="mt-3">
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 8, left: -24, bottom: 0 }}
          barSize={32}
        >
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#e2d5b0', fontSize: 10, fontWeight: 900 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
