import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface Mode {
  value: Theme;
  label: string;
  Icon: typeof Sun;
}

// 'system' first so the default preference reads as the leftmost/neutral
// position rather than something you opt out of.
const MODES: Mode[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export interface ThemeToggleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /** Icons only, no text labels — for toolbars and other tight chrome. */
  compact?: boolean;
}

/**
 * Segmented light / dark / system switcher. Reads and writes the shared
 * theme store, so it stays in step with every other theme control on screen.
 */
export function ThemeToggle({
  compact = false,
  className,
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Radiogroup semantics: one tab stop, arrows move between options and
  // select as they go (standard for a segmented control).
  const step = (from: number, delta: number) => {
    const next = (from + delta + MODES.length) % MODES.length;
    setTheme(MODES[next].value);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(index, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Color mode"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-[color:var(--surface-sunken)] p-0.5',
        'shadow-[inset_0_0_0_1px_var(--border-subtle)]',
        className,
      )}
      {...props}
    >
      {MODES.map((mode, index) => {
        const active = theme === mode.value;
        return (
          <button
            key={mode.value}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            aria-label={compact ? mode.label : undefined}
            title={compact ? mode.label : undefined}
            onClick={() => setTheme(mode.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium leading-none',
              'transition-colors duration-fast ease-steno',
              'focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--surface-sunken),0_0_0_3px_hsl(var(--accent-primary))]',
              compact ? 'size-[26px]' : 'h-[26px] gap-1.5 px-2.5',
              active
                ? 'bg-[color:var(--surface-raised)] text-[color:var(--fg-1)] shadow-[0_1px_2px_rgba(27,27,25,0.06)]'
                : 'text-[color:var(--fg-2)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--fg-1)]',
            )}
          >
            <mode.Icon className="size-[13px] shrink-0" aria-hidden />
            {!compact && <span>{mode.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
