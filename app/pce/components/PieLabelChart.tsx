'use client';

import { PieChart, Pie, Cell, Tooltip } from 'recharts';

type Entry = { label: string; count: number };

type Props = {
  data: Entry[];
  total: number;
  colors?: string[];
};

const DEFAULT_COLORS = [
  '#7c5cbf',
  '#2dd4bf',
  '#f59e0b',
  '#94a3b8',
  '#10b981',
  '#f43f5e',
  '#60a5fa',
  '#e2d5b0',
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { pct: number } }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d1f] px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{item.name}</p>
      <p className="font-black text-brand-cream">
        {item.value}{' '}
        <span className="font-normal text-white/50">({item.payload.pct}%)</span>
      </p>
    </div>
  );
};

export const PieLabelChart = ({
  data,
  total,
  colors = DEFAULT_COLORS,
}: Props) => {
  const chartData = data.map((d) => ({
    name: d.label,
    value: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <div className="flex items-center gap-5">
      {/* Pie sólido */}
      <div className="shrink-0">
        <PieChart width={170} height={170}>
          <Pie
            data={chartData}
            cx={84}
            cy={84}
            outerRadius={80}
            innerRadius={0}
            paddingAngle={1.5}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </div>

      {/* Label list */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-white/70">
                {entry.name}
              </span>
              <span
                className="shrink-0 text-[11px] font-black"
                style={{ color: colors[i % colors.length] }}
              >
                {entry.pct}%
              </span>
            </div>
            <div className="ml-4 h-0.75 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full opacity-70"
                style={{
                  width: `${entry.pct}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
