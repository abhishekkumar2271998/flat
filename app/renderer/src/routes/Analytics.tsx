import * as React from 'react';
import { ArrowDown, ArrowUp, ChartColumn, Table2 } from 'lucide-react';
import { MeetingsShell } from '@/components/MeetingsShell';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { useMeetings } from '@/hooks/useMeetings';
import { useFolders } from '@/hooks/useFolders';
import { useRecording } from '@/hooks/useRecording';
import { navigate } from '@/lib/router';
import {
  computeAnalytics,
  formatCount,
  formatDuration,
  formatHours,
  niceTicks,
  type FolderBucket,
  type LongestNote,
} from '@/lib/analytics';

/**
 * Marks are one ink hue on paper — the app has no chromatic accent, so every
 * chart here is a single sequential series. Slightly lifted off --fg-1 so a
 * dozen columns don't read as a wall of black; the hovered column goes to full
 * ink, which doubles as the hover affordance.
 */
const BAR_FILL = 'color-mix(in srgb, var(--fg-1) 78%, var(--page))';
const BAR_FILL_ACTIVE = 'var(--fg-1)';

const WEEKS = 12;

export function Analytics() {
  const meetings = useMeetings();
  const folders = useFolders();
  const recording = useRecording();

  // Pinned at mount: re-renders (a 1 Hz recording tick, a refetch) must not
  // shift the week buckets under the reader mid-session.
  const [now] = React.useState(() => new Date());

  const data = React.useMemo(
    () => computeAnalytics(meetings.data ?? [], folders.data ?? [], now, WEEKS),
    [meetings.data, folders.data, now],
  );

  const [weeksAsTable, setWeeksAsTable] = React.useState(false);

  const isRecording = recording.status === 'recording' || recording.status === 'paused';

  if (meetings.isLoading) {
    return (
      <MeetingsShell activeSummaryFile={null}>
        <div className="flex min-h-[40vh] items-center justify-center text-[color:var(--fg-2)]">
          Loading analytics…
        </div>
      </MeetingsShell>
    );
  }

  if (data.totals.noteCount === 0) {
    return (
      <MeetingsShell activeSummaryFile={null} contentAlign="center">
        <div className="flex flex-col items-center gap-7 text-center">
          <AppIcon size={48} />
          <div className="space-y-3">
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 34,
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: 'var(--fg-1)',
              }}
            >
              Nothing to measure yet.
            </h1>
            <p className="max-w-[44ch] text-[15px] leading-[1.55]" style={{ color: 'var(--fg-2)' }}>
              Capture a note and this page fills in — how much you record, when you
              record it, and where it all lives.
            </p>
          </div>
          <Button
            onClick={() =>
              isRecording ? navigate('/recording') : void recording.startRecording()
            }
          >
            {isRecording ? 'Back to recording' : 'New note'}
          </Button>
        </div>
      </MeetingsShell>
    );
  }

  const { totals, weeks, weekdays, folders: folderRows, longest } = data;

  const weekColumns = weeks.map((w) => {
    const end = new Date(w.start);
    end.setDate(end.getDate() + 6);
    const range = `${w.label} – ${end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`;
    return {
      label: w.label,
      value: w.count,
      tooltipTitle: range,
      tooltipBody: `${w.count} ${w.count === 1 ? 'note' : 'notes'} · ${formatDuration(w.seconds)}`,
    };
  });

  const weekdayColumns = weekdays.map((d) => ({
    label: d.label,
    value: d.seconds / 3600,
    tooltipTitle: d.label,
    tooltipBody: `${formatDuration(d.seconds)} across ${d.count} ${
      d.count === 1 ? 'note' : 'notes'
    }`,
  }));

  const firstDated = weeks.find((w) => w.count > 0);

  return (
    <MeetingsShell activeSummaryFile={null}>
      <header className="mb-9">
        <h1 className="home-hello">
          Analytics<span className="faint">.</span>
        </h1>
        <p className="mt-2.5 max-w-[54ch] text-sm leading-[1.55]" style={{ color: 'var(--fg-2)' }}>
          Counted on this Mac from the notes you have already captured. Nothing
          leaves the device to build this page.
        </p>
      </header>

      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Notes captured"
            value={formatCount(totals.noteCount)}
            hint={
              totals.actionItemCount > 0
                ? `${formatCount(totals.actionItemCount)} action items`
                : undefined
            }
          />
          <StatTile
            label="Time recorded"
            value={formatDuration(totals.totalSeconds)}
            hint={firstDated ? `since ${firstDated.label}` : undefined}
          />
          <StatTile label="Average note" value={formatDuration(totals.averageSeconds)} />
          <StatTile
            label="Last 7 days"
            value={formatCount(totals.last7)}
            hint={<WeekDelta last7={totals.last7} prev7={totals.prev7} />}
          />
        </div>
      </section>

      <section className="mb-10">
        <SectionHead
          title="Notes per week"
          hint={`last ${WEEKS} weeks`}
          action={
            <button
              type="button"
              onClick={() => setWeeksAsTable((v) => !v)}
              aria-pressed={weeksAsTable}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[color:var(--surface-hover)]"
              style={{ color: 'var(--fg-2)' }}
            >
              {weeksAsTable ? (
                <ChartColumn className="size-[13px]" aria-hidden />
              ) : (
                <Table2 className="size-[13px]" aria-hidden />
              )}
              {weeksAsTable ? 'Chart' : 'Table'}
            </button>
          }
        />
        {weeksAsTable ? (
          <table className="w-full text-[12.5px]">
            <caption className="sr-only">
              Notes captured and time recorded per week, last {WEEKS} weeks
            </caption>
            <thead>
              <tr style={{ color: 'var(--fg-2)' }}>
                <Th align="left">Week of</Th>
                <Th align="right">Notes</Th>
                <Th align="right">Recorded</Th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.start.toISOString()} style={{ color: 'var(--fg-1)' }}>
                  <Td align="left">{w.label}</Td>
                  <Td align="right">{w.count}</Td>
                  <Td align="right">{formatDuration(w.seconds)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ColumnChart
            columns={weekColumns}
            integersOnly
            formatTick={(v) => String(v)}
            formatValue={(v) => String(v)}
            ariaLabel={`Notes per week for the last ${WEEKS} weeks. Switch to the table view for the values.`}
          />
        )}
      </section>

      <section className="mb-10">
        <SectionHead title="When you record" hint="hours by weekday, all time" />
        <ColumnChart
          columns={weekdayColumns}
          height={148}
          formatTick={formatHours}
          formatValue={(v) => `${formatHours(v)}h`}
          ariaLabel="Total hours recorded by day of the week."
        />
      </section>

      <section className="mb-10">
        <SectionHead title="Where notes live" hint="by folder" />
        <FolderBars rows={folderRows} />
      </section>

      {longest.length > 0 && (
        <section>
          <SectionHead title="Longest notes" />
          <LongestList notes={longest} />
        </section>
      )}
    </MeetingsShell>
  );
}

// ---------------------------------------------------------------------------
// Section chrome
// ---------------------------------------------------------------------------

interface SectionHeadProps {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

function SectionHead({ title, hint, action }: SectionHeadProps) {
  return (
    <div
      className="mb-4 flex items-baseline justify-between gap-4 pb-2.5"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-baseline gap-2.5">
        <h2
          className="text-sm font-medium tracking-[-0.005em]"
          style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}
        >
          {title}
        </h2>
        {hint && (
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            {hint}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  hint?: React.ReactNode;
}

function StatTile({ label, value, hint }: StatTileProps) {
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
      {/* Proportional figures, not tabular — tabular-nums makes a display-size
          number look loose. Tabular is for the columns further down. */}
      <div
        className="mt-2 text-[23px] font-semibold leading-none tracking-[-0.02em]"
        style={{ color: 'var(--fg-1)' }}
      >
        {value}
      </div>
      <div className="mt-2 min-h-[14px] text-[11.5px]" style={{ color: 'var(--fg-muted)' }}>
        {hint}
      </div>
    </div>
  );
}

/** Neutral by design: more notes than last week is not inherently good or bad,
 *  so the delta gets muted ink and a direction glyph, never a status colour. */
function WeekDelta({ last7, prev7 }: { last7: number; prev7: number }) {
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

function Th({ align, children }: { align: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="pb-2 text-[11.5px] font-medium"
      style={{ textAlign: align, borderBottom: '1px solid var(--border-subtle)' }}
    >
      {children}
    </th>
  );
}

function Td({ align, children }: { align: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <td
      className="py-[7px] tabular-nums"
      style={{ textAlign: align, borderBottom: '1px solid var(--border-subtle)' }}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Column chart
// ---------------------------------------------------------------------------

const PAD = { top: 22, right: 6, bottom: 26, left: 38 };

interface Column {
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

function ColumnChart({
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
  // Capped so a wide band keeps its air instead of the bar filling the slot.
  const barW = Math.max(4, Math.min(24, band - 12));
  const yOf = (v: number) => PAD.top + plotH * (1 - v / top);
  // Direct-label the peak only — a value on every column reads as noise.
  const peak = max > 0 ? columns.findIndex((c) => c.value === max) : -1;
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
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="var(--border-subtle)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 9}
                y={yOf(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--fg-muted)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTick(t)}
              </text>
            </g>
          ))}

          {columns.map((c, i) => {
            const bandX = PAD.left + band * i;
            const barX = bandX + (band - barW) / 2;
            // Floor of 2px so a single note in a quiet week is still visible.
            const barH = c.value > 0 ? Math.max(2, (c.value / top) * plotH) : 0;
            const barY = PAD.top + plotH - barH;
            const isActive = hover === i;
            const showLabel = i % labelEvery === (labelEvery === 1 ? 0 : 1);
            return (
              <g key={`${c.label}-${i}`}>
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
                    d={columnPath(barX, barY, barW, barH, 4)}
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
                    {formatValue(c.value)}
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
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hit targets last so they sit above the marks. The whole band is
              the target, not just the bar — a 1-note column is 2px tall. */}
          {columns.map((c, i) => (
            <rect
              key={`hit-${c.label}-${i}`}
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

      {active && (
        <Tooltip
          x={clamp(PAD.left + band * (hover as number) + band / 2, 74, width - 74)}
          y={PAD.top + plotH * (1 - active.value / top) - 10}
          title={active.tooltipTitle}
          body={active.tooltipBody}
        />
      )}
    </div>
  );
}

interface TooltipProps {
  x: number;
  y: number;
  title: string;
  body: string;
}

function Tooltip({ x, y, title, body }: TooltipProps) {
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

/** Rounded data-end, square at the baseline. */
function columnPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x} ${y + h}`,
    `L${x} ${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    `L${x + w - radius} ${y}`,
    `Q${x + w} ${y} ${x + w} ${y + radius}`,
    `L${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

function clamp(v: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(v, min), max);
}

/** Live width of a block element, so charts render 1:1 instead of being
 *  scaled by a viewBox (which would blur hairlines and resize the type). */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (typeof next === 'number') setWidth(Math.round(next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

// ---------------------------------------------------------------------------
// Folder bars + longest notes
// ---------------------------------------------------------------------------

function FolderBars({ rows }: { rows: FolderBucket[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: 'minmax(0, 150px) 1fr auto' }}
          title={`${row.name} — ${row.count} ${row.count === 1 ? 'note' : 'notes'}, ${formatDuration(row.seconds)}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {row.color && (
              <span
                aria-hidden
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
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

function LongestList({ notes }: { notes: LongestNote[] }) {
  return (
    <div className="-mx-2 flex flex-col">
      {notes.map((note, i) => (
        <button
          key={note.summaryFile}
          type="button"
          onClick={() => navigate(`/meetings/${encodeURIComponent(note.summaryFile)}`)}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-[color:var(--surface-hover)]"
        >
          <span className="w-3 text-[11.5px] tabular-nums" style={{ color: 'var(--fg-muted)' }}>
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: 'var(--fg-1)' }}>
            {note.name}
          </span>
          <span className="text-[12.5px] tabular-nums" style={{ color: 'var(--fg-2)' }}>
            {formatDuration(note.seconds)}
          </span>
        </button>
      ))}
    </div>
  );
}
