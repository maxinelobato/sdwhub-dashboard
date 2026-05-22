'use client';

import React, { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/dashboard-utils';

export type RadarKpiCardProps = {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
  iconClass?: string;
  progress?: number;
  delay?: number;
};

const N = 6;
const R = 34;
const CX = 40;
const CY = 40;

function hexPts(r: number): string {
  return Array.from({ length: N }, (_, i) => {
    const a = (i * (2 * Math.PI)) / N - Math.PI / 2;
    return `${(CX + r * Math.cos(a)).toFixed(2)},${(CY + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const GRID_RINGS = [1, 2, 3, 4].map((s) => hexPts((R * s) / 4));
const SPOKE_ENDS = Array.from({ length: N }, (_, i) => {
  const a = (i * (2 * Math.PI)) / N - Math.PI / 2;
  return { x: (CX + R * Math.cos(a)).toFixed(2), y: (CY + R * Math.sin(a)).toFixed(2) };
});

export const RadarKpiCard = ({
  label,
  value,
  subValue,
  icon,
  color = '#7c5cbf',
  iconClass = 'bg-brand-purple',
  progress,
  delay = 0,
}: RadarKpiCardProps) => {
  const uid = useId().replace(/:/g, '');
  const hasProgress = typeof progress === 'number';
  const fillScale = hasProgress ? progress / 100 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className="shimmer-border relative rounded-2xl p-[1.5px]"
    >
      <div className="relative h-full overflow-hidden rounded-[14px] bg-[#1d1b3f] p-4">
        {/* Label + Icon */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
            {label}
          </span>
          {icon && (
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                iconClass,
              )}
            >
              {icon}
            </span>
          )}
        </div>

        {/* Radar SVG + value overlay */}
        <div className="relative flex items-center justify-center">
          <svg width={90} height={90} viewBox="0 0 80 80" aria-hidden>
            <defs>
              <radialGradient id={`rg-${uid}`} cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  stopColor={color}
                  stopOpacity={hasProgress ? 0.85 : 0.2}
                />
                <stop
                  offset="100%"
                  stopColor={color}
                  stopOpacity={hasProgress ? 0.1 : 0.03}
                />
              </radialGradient>
            </defs>

            {/* Concentric grid hexagons */}
            {GRID_RINGS.map((pts, i) => (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.75"
              />
            ))}

            {/* Spokes */}
            {SPOKE_ENDS.map((end, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.75"
              />
            ))}

            {/* Filled polygon — scales from center */}
            <motion.g
              style={{ transformOrigin: '50% 50%' }}
              initial={{ scale: 0 }}
              animate={{ scale: fillScale }}
              transition={{ duration: 0.85, delay: delay + 0.3, ease: 'easeOut' }}
            >
              <polygon
                points={hexPts(R)}
                fill={`url(#rg-${uid})`}
                stroke={color}
                strokeWidth={hasProgress ? 1.5 : 0.5}
                strokeOpacity={hasProgress ? 0.9 : 0.2}
              />
            </motion.g>

            {/* Center dot */}
            <circle
              cx={CX}
              cy={CY}
              r="2.5"
              fill={color}
              opacity={hasProgress ? 0.8 : 0.25}
            />
          </svg>

          {/* Value text centered over radar */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-display text-2xl leading-none font-black tracking-tighter drop-shadow-lg md:text-3xl">
              {value}
            </span>
            {subValue && (
              <p className="max-w-[72px] text-center text-[8px] font-bold leading-tight tracking-wider text-white/50 uppercase">
                {subValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
