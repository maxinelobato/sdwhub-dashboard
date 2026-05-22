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
  total: number;
  color?: string;
  maxItems?: number;
  labelTruncate?: number;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d1f] px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white/70">{label}</p>
      <p className="font-black text-brand-cream">{payload[0].value} menções</p>
    </div>
  );
};

export const ReBarChart = ({
  data,
  color = '#7c5cbf',
  maxItems = 8,
  labelTruncate = 22,
}: Props) => {
  const items = data.slice(0, maxItems).map((d) => ({
    ...d,
    name: d.label.length > labelTruncate ? d.label.slice(0, labelTruncate) + '…' : d.label,
    fullLabel: d.label,
  }));

  return (
    <div className="mt-3">
      <ResponsiveContainer width="100%" height={items.length * 36 + 16}>
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
          barSize={12}
        >
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {items.map((_, i) => (
              <Cell
                key={i}
                fill={color}
                fillOpacity={1 - i * 0.07}
              />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fill: '#e2d5b0', fontSize: 10, fontWeight: 900 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
