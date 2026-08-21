import * as React from 'react';

interface SectionHeadProps {
  title: string;
  /** Scope of what's plotted below ("last 12 weeks") — reads as a subtitle. */
  hint?: string;
  action?: React.ReactNode;
}

export function SectionHead({ title, hint, action }: SectionHeadProps) {
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
