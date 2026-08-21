import * as React from 'react';
import { useMeasuredWidth } from '@/hooks/useMeasuredWidth';
import { niceTicks } from '@/lib/analytics';
import { BAR_FILL, BAR_FILL_ACTIVE, clamp, columnPath } from '@/components/analytics/marks';

const PAD = { top: 22, right: 6, bottom: 26, left: 38 };
/** Bars are capped rather than filling their slot — the leftover band is air. */
const MAX_BAR_WIDTH = 24;

export interface Column {
  label: string;
  value: number;
  tooltipTitle: string;
  tooltipBody: string;
}

interface ColumnChartProps {
  columns: Column[];
  height?: number;
  /** Keeps count axes off fractional ticks ("1.5 notes"). */
  integersOnly?: boolean;
  formatTick: (v: number) => string;
  formatValue: (v: number) => string;
  ariaLabel: string;
}

export function ColumnChart({
  columns,
  height = 190,
  integersOnly = false,
  formatTick,
  formatValue,
  ariaLabel,
}: ColumnChartProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);

  const max = columns.reduce((m, c) => Math.max(m, c.value), 0);
  const ticks = niceTicks(max, 3, integersOnly);
  const top = ticks[ticks.length - 1] || 1;

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = columns.length > 0 ? plotW / columns.length : 0;
  const barW = Math.max(4, Math.min(MAX_BAR_WIDTH, band - 12));
  const yOf = (v: number) => PAD.top + plotH * (1 - v / top);

  // Direct-label the peak only — a value on every column reads as noise.
  const peak = max > 0 ? columns.findIndex((c) => c.value === max) : -1;
  // Every other x label once the band gets too tight for the full set.
  const labelEvery = band >= 46 ? 1 : 2;

  const active = hover !== null ? columns[hover] : undefined;

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yOf(tick)}
                y2={yOf(tick)}
                stroke="var(--border-subtle)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 9}
                y={yOf(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--fg-muted)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTick(tick)}
              </text>
            </g>
          ))}

          {columns.map((column, i) => {
            const bandX = PAD.left + band * i;
            const barX = bandX + (band - barW) / 2;
            // 2px floor so a single note in a quiet week is still visible.
            const barH = column.value > 0 ? Math.max(2, (column.value / top) * plotH) : 0;
            const barY = PAD.top + plotH - barH;
            const isActive = hover === i;
            const showLabel = labelEvery === 1 || i % 2 === 1;
            return (
              <g key={`${column.label}-${i}`}>
                {isActive && (
                  <rect
                    x={bandX}
                    y={PAD.top}
                    width={band}
                    height={plotH}
                    rx={4}
                    fill="var(--surface-hover)"
                  />
                )}
                {barH > 0 && (
                  <path
                    d={columnPath(barX, barY, barW, barH)}
                    fill={isActive ? BAR_FILL_ACTIVE : BAR_FILL}
                  />
                )}
                {i === peak && !isActive && (
                  <text
                    x={barX + barW / 2}
                    y={barY - 7}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight={500}
                    fill="var(--fg-2)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatValue(column.value)}
                  </text>
                )}
                {showLabel && (
                  <text
                    x={bandX + band / 2}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isActive ? 'var(--fg-2)' : 'var(--fg-muted)'}
                  >
                    {column.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hit targets last so they sit above the marks. The whole band is
              the target, not just the bar — a one-note column is 2px tall. */}
          {columns.map((column, i) => (
            <rect
              key={`hit-${column.label}-${i}`}
              x={PAD.left + band * i}
              y={PAD.top}
              width={band}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      )}

      {active && hover !== null && (
        <ChartTooltip
          x={clamp(PAD.left + band * hover + band / 2, 76, Math.max(76, width - 76))}
          y={yOf(active.value) - 10}
          title={active.tooltipTitle}
          body={active.tooltipBody}
        />
      )}
    </div>
  );
}

interface ChartTooltipProps {
  x: number;
  y: number;
  title: string;
  body: string;
}

function ChartTooltip({ x, y, title, body }: ChartTooltipProps) {
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-10 whitespace-nowrap px-2.5 py-1.5"
      style={{
        left: x,
        top: Math.max(0, y),
        transform: 'translate(-50%, -100%)',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="text-[11.5px] font-medium" style={{ color: 'var(--fg-1)' }}>
        {title}
      </div>
      <div className="mt-0.5 text-[11px] tabular-nums" style={{ color: 'var(--fg-2)' }}>
        {body}
      </div>
    </div>
  );
}
