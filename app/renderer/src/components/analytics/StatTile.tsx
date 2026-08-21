import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string;
  hint?: React.ReactNode;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="text-[11.5px] font-medium" style={{ color: 'var(--fg-2)' }}>
        {label}
      </div>
      {/* Proportional figures, not tabular — tabular-nums gives every digit the
          width of a zero, which reads loose at display sizes. Tabular is for
          the aligned columns further down the page. */}
      <div
        className="mt-2 text-[23px] font-semibold leading-none tracking-[-0.02em]"
        style={{ color: 'var(--fg-1)' }}
      >
        {value}
      </div>
      {/* Reserved even when empty so the four tiles keep a common baseline. */}
      <div className="mt-2 min-h-[14px] text-[11.5px]" style={{ color: 'var(--fg-muted)' }}>
        {hint}
      </div>
    </div>
  );
}

/**
 * Week-over-week change for the "Last 7 days" tile. Deliberately neutral:
 * recording more notes than last week isn't inherently good or bad, so the
 * delta gets muted ink and a direction glyph rather than a status colour.
 */
export function WeekDelta({ last7, prev7 }: { last7: number; prev7: number }) {
  const diff = last7 - prev7;
  if (last7 === 0 && prev7 === 0) return <>none the week before either</>;
  if (diff === 0) return <>same as the week before</>;
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-[11px]" aria-hidden />
      {Math.abs(diff)} vs previous 7 days
    </span>
  );
}
