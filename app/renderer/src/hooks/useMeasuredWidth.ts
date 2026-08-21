import * as React from 'react';

/**
 * Live pixel width of a block element.
 *
 * Charts use this to render 1:1 at the container's real width instead of being
 * scaled by an SVG viewBox — a viewBox scale blurs hairline gridlines and
 * resizes axis type along with the geometry.
 */
export function useMeasuredWidth<T extends HTMLElement>() {
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
