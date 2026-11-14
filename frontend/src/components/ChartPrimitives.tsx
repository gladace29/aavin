import { useRef, type ReactNode } from 'react';
import { InfoTooltip } from './UiPrimitives';

export interface ChartCardShellProps {
  title: string;
  subtitle: string;
  tooltip?: string;
  badge?: ReactNode;
  headerRight?: ReactNode;
  summaryStrip?: ReactNode;
  legendItems?: ReadonlyArray<{ color: string; label: string; dashed?: boolean }>;
  isEmpty: boolean;
  emptyMessage: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  children: ReactNode;
}

/**
 * Ensures instantaneous touch/tap response on mobile screens for Recharts.
 * Recharts 3.10 handles touch event state inside touchmove but ignores touchstart alone;
 * dispatching a touchmove event with the same touch coordinate ensures immediate selection on tap.
 */
export function handleChartTouchStart(_state: unknown, event?: React.TouchEvent<SVGGraphicsElement>) {
  try {
    const rawTarget = event?.currentTarget as unknown as HTMLElement | null;
    if (rawTarget && event && event.touches && event.touches.length > 0) {
      const touch = event.touches[0] as unknown as Touch;
      if (typeof TouchEvent === 'function') {
        const moveEvent = new TouchEvent('touchmove', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true,
        });
        rawTarget.dispatchEvent(moveEvent);
      }
    }
  } catch {
    // Ignore fallback for environments without TouchEvent constructor
  }
}

/**
 * Dismisses any active/stuck tooltip on the target chart container by simulating mouseleave.
 */
export function dismissChartTooltip(container: HTMLElement | null) {
  if (!container) return;
  const wrapper = container.querySelector('.recharts-wrapper');
  if (wrapper) {
    wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }
}

/** Shared card wrapper with header, contextual subtitle, badge/toggle controls, summary strip, tap-to-dismiss, and empty CTA. */
export function ChartCardShell({
  title,
  subtitle,
  tooltip,
  badge,
  headerRight,
  summaryStrip,
  legendItems,
  isEmpty,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  children,
}: ChartCardShellProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardDismiss = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // If the user clicks or taps outside the active SVG plot (e.g. on header, legend, or empty card margin),
    // dismiss any open sticky tooltip so they can easily reset/unclutter the graph on mobile.
    const target = e.target as HTMLElement | null;
    if (target && !target.closest('svg') && !target.closest('button') && !target.closest('input')) {
      dismissChartTooltip(cardRef.current);
    }
  };

  return (
    <div
      ref={cardRef}
      className="card chart-card"
      onClick={handleCardDismiss}
      onTouchEnd={handleCardDismiss}
    >
      <div className="chart-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h2>{title}</h2>
            {tooltip && <InfoTooltip text={tooltip} label={title} />}
          </div>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {headerRight}
          {badge}
        </div>
      </div>

      {isEmpty ? (
        <div className="chart-empty" style={{ flexDirection: 'column', gap: '0.75rem', padding: '1rem', textAlign: 'center' }}>
          <p>{emptyMessage}</p>
          {emptyActionLabel && onEmptyAction && (
            <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={onEmptyAction}>
              {emptyActionLabel}
            </button>
          )}
        </div>
      ) : (
        <>
          {summaryStrip}
          {legendItems && legendItems.length > 0 && (
            <div className="chart-legend" aria-label="Chart legend">
              {legendItems.map((item) => (
                <span key={item.label} className="chart-legend-item">
                  <span
                    className={item.dashed ? 'chart-line-sample' : 'chart-dot'}
                    style={item.dashed ? { borderTopColor: item.color } : { backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}

export interface TooltipRowProps {
  color: string;
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
}

export function TooltipRow({ color, label, value, tone }: TooltipRowProps) {
  return (
    <div className="chart-tooltip-row">
      <span className="chart-tooltip-label">
        <span className="chart-dot" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className={`chart-tooltip-val ${tone === 'positive' ? 'profit-pos' : tone === 'negative' ? 'profit-neg' : ''}`}>
        {value}
      </span>
    </div>
  );
}
