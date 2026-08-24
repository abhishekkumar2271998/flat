/* Scratch harness — renders the analytics visuals outside Electron so the
   geometry can be screenshotted. Not part of the app build. */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import { ColumnChart, type Column } from '@/components/analytics/ColumnChart';
import { FolderBars } from '@/components/analytics/FolderBars';
import { LongestList } from '@/components/analytics/LongestList';
import { SectionHead } from '@/components/analytics/SectionHead';
import { StatTile, WeekDelta } from '@/components/analytics/StatTile';
import {
  computeAnalytics,
  formatCount,
  formatDuration,
  formatHours,
} from '@/lib/analytics';
import type { Folder, Meeting } from '@/lib/ipc';

const NOW = new Date(2026, 7, 21, 14, 0, 0);

const FOLDERS: Folder[] = [
  { id: 'acme', name: 'Acme Corp', color: '#B84A3A', order: 0 },
  { id: 'hiring', name: 'Hiring loop', color: '#4F7A5B', order: 1 },
  { id: 'design', name: 'Design reviews & critique sessions', color: '#6B6B66', order: 2 },
  { id: 'board', name: 'Board', color: '#3D3D39', order: 3 },
  { id: 'a', name: 'Alpha', color: '#A8A8A0', order: 4 },
  { id: 'b', name: 'Beta', color: '#D6D4CB', order: 5 },
  { id: 'c', name: 'Gamma', color: '#B84A3A', order: 6 },
  { id: 'd', name: 'Delta', color: '#4F7A5B', order: 7 },
];

/** Weekly note counts, oldest → newest. Includes empty weeks and a lone 1. */
const WEEKLY = [3, 0, 5, 1, 4, 7, 0, 6, 9, 4, 12, 2];

function makeMeetings(): Meeting[] {
  const out: Meeting[] = [];
  let n = 0;
  WEEKLY.forEach((count, weekIndex) => {
    for (let i = 0; i < count; i += 1) {
      const daysAgo = (WEEKLY.length - 1 - weekIndex) * 7 + (i % 7);
      const when = new Date(NOW);
      when.setDate(when.getDate() - daysAgo);
      when.setHours(9 + (i % 8), 30, 0, 0);
      n += 1;
      const folderId = FOLDERS[n % FOLDERS.length].id;
      out.push({
        session_info: {
          name:
            n % 6 === 0
              ? 'Quarterly planning with the extended leadership team and guests'
              : `Standup ${n}`,
          summary_file: `summary_${n}.json`,
          processed_at: when.toISOString(),
          duration_seconds: 240 + ((n * 517) % 5400),
          folders: n % 5 === 0 ? [] : [folderId],
        },
        summary: 'Synthetic',
        transcript: '',
        action_items: Array.from({ length: n % 4 }, (_, k) => `item ${k}`),
        folders: n % 5 === 0 ? [] : [folderId],
      });
    }
  });
  return out;
}

const DATA = computeAnalytics(makeMeetings(), FOLDERS, NOW, 12);

const weekColumns: Column[] = DATA.weeks.map((week) => {
  const end = new Date(week.start);
  end.setDate(end.getDate() + 6);
  return {
    label: week.label,
    value: week.count,
    tooltipTitle: `${week.label} – ${end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`,
    tooltipBody: `${week.count} notes · ${formatDuration(week.seconds)}`,
  };
});

const weekdayColumns: Column[] = DATA.weekdays.map((day) => ({
  label: day.label,
  value: day.seconds / 3600,
  tooltipTitle: day.label,
  tooltipBody: `${formatDuration(day.seconds)} across ${day.count} notes`,
}));

function Panel({ width }: { width: number }) {
  const { totals, folders, longest } = DATA;
  return (
    <div style={{ width, padding: 24 }}>
      <div className="mb-8">
        <h1 className="home-hello">
          Analytics<span className="faint">.</span>
        </h1>
      </div>

      <section className="mb-10">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(142px, 1fr))' }}
        >
          <StatTile
            label="Notes captured"
            value={formatCount(totals.noteCount)}
            hint={`${formatCount(totals.actionItemCount)} action items`}
          />
          <StatTile
            label="Time recorded"
            value={formatDuration(totals.totalSeconds)}
            hint="since May 28"
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
        <SectionHead title="Notes per week" hint="last 12 weeks" />
        <ColumnChart
          columns={weekColumns}
          integersOnly
          formatTick={(v) => String(v)}
          formatValue={(v) => String(v)}
          ariaLabel="preview"
        />
      </section>

      <section className="mb-10">
        <SectionHead title="When you record" hint="hours by weekday, all time" />
        <ColumnChart
          columns={weekdayColumns}
          height={150}
          formatTick={formatHours}
          formatValue={(v) => `${formatHours(v)}h`}
          ariaLabel="preview"
        />
      </section>

      <section className="mb-10">
        <SectionHead title="Where notes live" hint="notes per folder" />
        <FolderBars rows={folders} />
      </section>

      <section className="mb-10">
        <SectionHead title="Longest notes" />
        <LongestList notes={longest} />
      </section>

      <section>
        <SectionHead title="Notes per week (table view)" />
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ color: 'var(--fg-2)' }}>
              {(['Week of', 'Notes', 'Recorded'] as const).map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className="pb-2 text-[11.5px] font-medium"
                  style={{
                    textAlign: i === 0 ? 'left' : 'right',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA.weeks.slice(0, 4).map((week) => (
              <tr key={week.start.toISOString()} style={{ color: 'var(--fg-1)' }}>
                {[week.label, String(week.count), formatDuration(week.seconds)].map((cell, i) => (
                  <td
                    key={i}
                    className="py-[7px] tabular-nums"
                    style={{
                      textAlign: i === 0 ? 'left' : 'right',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: 'var(--page)', color: 'var(--fg-1)' }}>
        <Panel width={688} />
      </div>
      <div style={{ background: 'var(--page)', color: 'var(--fg-1)' }}>
        <Panel width={420} />
      </div>
      <div className="dark" style={{ background: 'var(--page)', color: 'var(--fg-1)' }}>
        <Panel width={688} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

// Force a hover on the tallest column of the first chart so the screenshot
// shows the tooltip + active-band treatment.
window.setTimeout(() => {
  const svg = document.querySelectorAll('svg')[0];
  const hits = svg?.querySelectorAll('rect[fill="transparent"]');
  const target = hits?.[10];
  target?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}, 400);
