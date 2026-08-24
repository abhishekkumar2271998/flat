import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToolbarIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Used for both the accessible name and the native tooltip. */
  label: string;
  /** Renders the pressed/current state (e.g. the Settings route is open). */
  active?: boolean;
}

/**
 * The 26×28 ghost icon button the main toolbar is built from.
 *
 * Deliberately not `Button variant="ghost" size="icon"` — that primitive is
 * 36×36 with `rounded-lg` and hovers on `--muted`, which is the right shape for
 * dialogs and page bodies but too heavy for the title-bar row. Keeping the
 * toolbar's own metrics in one component stops the four buttons in that row
 * from drifting apart.
 */
export const ToolbarIconButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarIconButtonProps
>(function ToolbarIconButton(
  { label, active = false, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-[26px] w-7 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--fg-1)]',
        active
          ? 'bg-[color:var(--surface-active)] text-[color:var(--fg-1)]'
          : 'text-[color:var(--fg-2)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
