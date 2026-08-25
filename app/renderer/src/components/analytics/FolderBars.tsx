import { formatDuration, type FolderBucket } from '@/lib/analytics';
import { BAR_FILL } from '@/components/analytics/marks';

/**
 * Horizontal bars, one per folder, value direct-labelled at the tip. Horizontal
 * because folder names are long and arbitrary — a column chart would have to
 * rotate or truncate them.
 */
export function FolderBars({ rows }: { rows: FolderBucket[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: 'minmax(0, 150px) 1fr auto' }}
          title={`${row.name} — ${row.count} ${
            row.count === 1 ? 'note' : 'notes'
          }, ${formatDuration(row.seconds)}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {/* Identity sits in the dot beside the label, never in the bar:
                folder colours are user-chosen and unvalidated, so they never
                carry the data itself. Always rendered — the Unfiled and Other
                rows have no colour, and dropping the dot would leave their
                labels hanging left of every other row. */}
            <span
              aria-hidden
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: row.color ?? 'var(--border-strong)' }}
            />
            <span className="truncate text-[13px]" style={{ color: 'var(--fg-1)' }}>
              {row.name}
            </span>
          </div>
          <div className="h-2">
            <div
              style={{
                width: `${(row.count / max) * 100}%`,
                minWidth: row.count > 0 ? 2 : 0,
                height: 8,
                background: BAR_FILL,
                // Rounded data-end, square where it leaves the baseline.
                borderRadius: '0 4px 4px 0',
              }}
            />
          </div>
          <span
            className="w-8 text-right text-[12px] tabular-nums"
            style={{ color: 'var(--fg-2)' }}
          >
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
