import { formatDuration, type LongestNote } from '@/lib/analytics';
import { navigate } from '@/lib/router';

/** Five longest notes, each a shortcut into the note itself. */
export function LongestList({ notes }: { notes: LongestNote[] }) {
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
