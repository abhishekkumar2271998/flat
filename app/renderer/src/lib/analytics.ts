/**
 * Derivation helpers behind the /analytics route.
 *
 * Everything here is pure — no IPC, no React. The Analytics page is computed
 * entirely from the meetings + folders lists the app already loads, so it adds
 * no backend surface and no new CLI commands.
 */
import type { Folder, Meeting } from '@/lib/ipc';

const DAY_MS = 86_400_000;
/** Folder rows past this many are folded into a single "Other" row. */
const MAX_FOLDER_ROWS = 6;
/** How many notes the "Longest notes" list shows. */
const LONGEST_COUNT = 5;

export interface Totals {
  noteCount: number;
  totalSeconds: number;
  /** Mean duration across notes that actually carry one. */
  averageSeconds: number;
  actionItemCount: number;
  /** Notes dated in the last 7 days (today inclusive). */
  last7: number;
  /** Notes dated in the 7 days before that, for the delta. */
  prev7: number;
}

export interface WeekBucket {
  /** Local midnight the bucket opens on. */
  start: Date;
  label: string;
  count: number;
  seconds: number;
}

export interface WeekdayBucket {
  label: string;
  count: number;
  seconds: number;
}

export interface FolderBucket {
  key: string;
  name: string;
  /** User-chosen folder colour, for the identity dot beside the label. */
  color?: string;
  count: number;
  seconds: number;
}

export interface LongestNote {
  summaryFile: string;
  name: string;
  seconds: number;
}

export interface Analytics {
  totals: Totals;
  weeks: WeekBucket[];
  weekdays: WeekdayBucket[];
  folders: FolderBucket[];
  longest: LongestNote[];
}

const UNFILED_KEY = '__unfiled__';
const OTHER_KEY = '__other__';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Whole days between two local midnights. Rounded rather than floored so a
 *  DST shift inside the span (±1h) can't push the result across a boundary. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** When a note happened. Falls back to updated_at, and returns null for the
 *  malformed timestamps older summary files occasionally carry. */
export function meetingDate(m: Meeting): Date | null {
  const raw = m.session_info.processed_at ?? m.session_info.updated_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function durationOf(m: Meeting): number {
  const s = m.session_info.duration_seconds;
  return typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : 0;
}

/** Real, on-disk notes. useMeetings() prepends a synthetic row for the
 *  recording currently in flight; it has no duration or summary yet and would
 *  skew every total, so analytics ignores it. */
export function realMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.filter((m) => !m.is_recording && !m.is_processing);
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

function weekLabel(start: Date): string {
  return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** getDay() order, Monday-first — the ordering that reads as a work week. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Locale weekday name for a getDay() value. 2024-01-01 was a Monday, so
 *  indexing off it gives the right day without hardcoding English. */
function weekdayLabel(dayOfWeek: number): string {
  const ref = new Date(2024, 0, 1 + ((dayOfWeek + 6) % 7));
  return ref.toLocaleDateString(undefined, { weekday: 'short' });
}

// ---------------------------------------------------------------------------
// Main derivation
// ---------------------------------------------------------------------------

export function computeAnalytics(
  allMeetings: Meeting[],
  folders: Folder[],
  now: Date = new Date(),
  weekCount = 12,
): Analytics {
  const meetings = realMeetings(allMeetings);
  const today = startOfDay(now);

  // Rolling 7-day buckets ending today, so the last column is always "this
  // week so far" regardless of which day the locale starts its week on.
  const lastWeekStart = addDays(today, -6);
  const firstWeekStart = addDays(lastWeekStart, -7 * (weekCount - 1));
  const weeks: WeekBucket[] = Array.from({ length: weekCount }, (_, i) => {
    const start = addDays(firstWeekStart, i * 7);
    return { start, label: weekLabel(start), count: 0, seconds: 0 };
  });

  const weekdays: WeekdayBucket[] = WEEKDAY_ORDER.map((d) => ({
    label: weekdayLabel(d),
    count: 0,
    seconds: 0,
  }));
  const weekdaySlot = new Map(WEEKDAY_ORDER.map((d, i) => [d, i]));

  const knownFolders = new Map(folders.map((f) => [f.id, f]));
  const folderBuckets = new Map<string, FolderBucket>();

  let totalSeconds = 0;
  let timedCount = 0;
  let actionItemCount = 0;
  let last7 = 0;
  let prev7 = 0;

  for (const m of meetings) {
    const seconds = durationOf(m);
    if (seconds > 0) {
      totalSeconds += seconds;
      timedCount += 1;
    }
    if (Array.isArray(m.action_items)) actionItemCount += m.action_items.length;

    // --- folder bucket: a note lives in at most one folder in this UI, so
    // credit it to the first folder that still exists, else Unfiled.
    const ids = [...(m.folders ?? []), ...(m.session_info.folders ?? [])];
    const folder = ids.map((id) => knownFolders.get(id)).find(Boolean);
    const key = folder?.id ?? UNFILED_KEY;
    const bucket = folderBuckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.seconds += seconds;
    } else {
      folderBuckets.set(key, {
        key,
        name: folder?.name ?? 'Unfiled',
        color: folder?.color,
        count: 1,
        seconds,
      });
    }

    const when = meetingDate(m);
    if (!when) continue;

    const age = daysBetween(startOfDay(when), today);
    if (age >= 0 && age < 7) last7 += 1;
    else if (age >= 7 && age < 14) prev7 += 1;

    const slot = weekdaySlot.get(when.getDay());
    if (slot !== undefined) {
      weekdays[slot].count += 1;
      weekdays[slot].seconds += seconds;
    }

    // Future-dated notes (clock skew, imported files) fall outside the window
    // rather than being clamped into the newest column.
    const dayIndex = daysBetween(firstWeekStart, startOfDay(when));
    if (dayIndex < 0) continue;
    const weekIndex = Math.floor(dayIndex / 7);
    if (weekIndex >= weekCount) continue;
    weeks[weekIndex].count += 1;
    weeks[weekIndex].seconds += seconds;
  }

  const sortedFolders = [...folderBuckets.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
  const folderRows = sortedFolders.slice(0, MAX_FOLDER_ROWS);
  const tail = sortedFolders.slice(MAX_FOLDER_ROWS);
  if (tail.length > 0) {
    folderRows.push({
      key: OTHER_KEY,
      name: `Other (${tail.length} folders)`,
      count: tail.reduce((sum, f) => sum + f.count, 0),
      seconds: tail.reduce((sum, f) => sum + f.seconds, 0),
    });
  }

  const longest: LongestNote[] = meetings
    .filter((m) => durationOf(m) > 0)
    .sort((a, b) => durationOf(b) - durationOf(a))
    .slice(0, LONGEST_COUNT)
    .map((m) => ({
      summaryFile: m.session_info.summary_file,
      name: m.session_info.name || 'Untitled note',
      seconds: durationOf(m),
    }));

  return {
    totals: {
      noteCount: meetings.length,
      totalSeconds,
      averageSeconds: timedCount > 0 ? Math.round(totalSeconds / timedCount) : 0,
      actionItemCount,
      last7,
      prev7,
    },
    weeks,
    weekdays,
    folders: folderRows,
    longest,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** "3h 20m" / "48m" / "35s" / "—". Two units at most — a third is noise. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${total}s`;
}

/** Compact counts for stat-tile values: 1,284 → "1,284"; 12,900 → "12.9K". */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) < 10_000) return n.toLocaleString();
  if (Math.abs(n) < 1_000_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

/** Axis-tick hours: "0" / "1.5" / "12". */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return '0';
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------

function niceStep(raw: number, integersOnly: boolean): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const scaled = raw / magnitude;
  const ladder = integersOnly ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  const step = (ladder.find((c) => scaled <= c) ?? 10) * magnitude;
  return integersOnly ? Math.max(1, Math.round(step)) : step;
}

/**
 * Gridline values from 0 up to at least `max`, on round numbers.
 * `integersOnly` keeps count axes off fractional ticks ("1.5 notes").
 */
export function niceTicks(
  max: number,
  targetIntervals = 3,
  integersOnly = false,
): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const step = niceStep(max / targetIntervals, integersOnly);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Accumulate by index rather than by repeated addition so float steps
  // (2.5, 0.5) don't drift into 7.499999999.
  for (let i = 0; i * step <= top + step / 1000; i += 1) {
    ticks.push(Number((i * step).toPrecision(12)));
  }
  return ticks;
}
