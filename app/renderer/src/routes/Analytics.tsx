import * as React from 'react';
import { ChartColumn, Table2 } from 'lucide-react';
import { MeetingsShell } from '@/components/MeetingsShell';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { ColumnChart, type Column } from '@/components/analytics/ColumnChart';
import { FolderBars } from '@/components/analytics/FolderBars';
import { LongestList } from '@/components/analytics/LongestList';
import { SectionHead } from '@/components/analytics/SectionHead';
import { StatTile, WeekDelta } from '@/components/analytics/StatTile';
import { useMeetings } from '@/hooks/useMeetings';
import { useFolders } from '@/hooks/useFolders';
import { useRecording } from '@/hooks/useRecording';
import { navigate } from '@/lib/router';
import {
  computeAnalytics,
  formatCount,
  formatDuration,
  formatHours,
} from '@/lib/analytics';

const WEEKS = 12;

export function Analytics() {
  const meetings = useMeetings();
  const folders = useFolders();
  const recording = useRecording();

  // Pinned at mount: re-renders (the 1 Hz recording tick, a background
  // refetch) must not shift the week buckets under the reader mid-session.
  const [now] = React.useState(() => new Date());

  const data = React.useMemo(
    () => computeAnalytics(meetings.data ?? [], folders.data ?? [], now, WEEKS),
    [meetings.data, folders.data, now],
  );

  const [weeksAsTable, setWeeksAsTable] = React.useState(false);

  const isRecording = recording.status === 'recording' || recording.status === 'paused';

  const weekColumns = React.useMemo<Column[]>(
    () =>
      data.weeks.map((week) => {
        const end = new Date(week.start);
        end.setDate(end.getDate() + 6);
        const endLabel = end.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        return {
          label: week.label,
          value: week.count,
          tooltipTitle: `${week.label} – ${endLabel}`,
          tooltipBody: `${week.count} ${week.count === 1 ? 'note' : 'notes'} · ${formatDuration(
            week.seconds,
          )}`,
        };
      }),
    [data.weeks],
  );

  const weekdayColumns = React.useMemo<Column[]>(
    () =>
      data.weekdays.map((day) => ({
        label: day.label,
        value: day.seconds / 3600,
        tooltipTitle: day.label,
        tooltipBody: `${formatDuration(day.seconds)} across ${day.count} ${
          day.count === 1 ? 'note' : 'notes'
        }`,
      })),
    [data.weekdays],
  );

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
            <p
              className="max-w-[44ch] text-[15px] leading-[1.55]"
              style={{ color: 'var(--fg-2)' }}
            >
              Capture a note and this page fills in — how much you record, when you
              record it, and where it all ends up.
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

  const { totals, weeks, folders: folderRows, longest } = data;
  const firstActiveWeek = weeks.find((w) => w.count > 0);

  return (
    <MeetingsShell activeSummaryFile={null}>
      <header className="mb-9">
        <h1 className="home-hello">
          Analytics<span className="faint">.</span>
        </h1>
        <p
          className="mt-2.5 max-w-[54ch] text-sm leading-[1.55]"
          style={{ color: 'var(--fg-2)' }}
        >
          Counted on this Mac from notes you have already captured. Nothing leaves
          the device to build this page.
        </p>
      </header>

      <section className="mb-10">
        {/* auto-fit rather than a viewport breakpoint: what matters is the
            width of the notes column, which also shrinks when the sidebar is
            expanded or resized — a `sm:` breakpoint would keep four cramped
            tiles in a narrow column on a wide window. */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(142px, 1fr))' }}
        >
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
            hint={firstActiveWeek ? `since ${firstActiveWeek.label}` : undefined}
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
              {weeks.map((week) => (
                <tr key={week.start.toISOString()} style={{ color: 'var(--fg-1)' }}>
                  <Td align="left">{week.label}</Td>
                  <Td align="right">{week.count}</Td>
                  <Td align="right">{formatDuration(week.seconds)}</Td>
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
            ariaLabel={`Notes captured per week over the last ${WEEKS} weeks. Switch to the table view for the values.`}
          />
        )}
      </section>

      <section className="mb-10">
        <SectionHead title="When you record" hint="hours by weekday, all time" />
        <ColumnChart
          columns={weekdayColumns}
          height={150}
          formatTick={formatHours}
          formatValue={(v) => `${formatHours(v)}h`}
          ariaLabel="Total hours recorded by day of the week."
        />
      </section>

      <section className="mb-10">
        <SectionHead title="Where notes live" hint="notes per folder" />
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
