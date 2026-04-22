import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorPanel } from "../../../components/common/ErrorPanel";
import { Skeleton } from "../../../components/common/Skeleton";

interface ChartCardProps {
  chartId: string;
  title: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: { title: string; message: string; missingFields?: string[] } | null;
  children?: ReactNode;
  className?: string;
  onExpand?: (chartId: string, trigger: HTMLButtonElement) => void;
}

export function ChartCard({ chartId, title, subtitle, headerExtra, loading, error, empty, children, className, onExpand }: ChartCardProps) {
  const canExpand = Boolean(!loading && !error && !empty && children && onExpand);
  return (
    <Card
      className={`rounded-[var(--dashboard-radius-card)] border-[var(--dashboard-border)] bg-[var(--dashboard-card)] shadow-[0_14px_32px_rgba(15,23,42,0.032)] transition-shadow duration-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.04)] ${className ?? ""}`}
    >
      <CardHeader className="px-6 pt-6 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-[0.95rem] font-semibold text-[var(--dashboard-text)]">{title}</CardTitle>
            {subtitle ? <p className="mt-1 text-xs text-[var(--dashboard-muted)]">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {headerExtra ?? null}
            <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Download chart"
              title="Download chart"
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--dashboard-muted)] transition hover:bg-slate-100 hover:text-[var(--dashboard-text)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Expand chart"
              title="Expand chart"
              disabled={!canExpand}
              onClick={(event) => {
                if (!onExpand) return;
                onExpand(chartId, event.currentTarget);
              }}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--dashboard-muted)] transition hover:bg-slate-100 hover:text-[var(--dashboard-text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
                <path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" />
              </svg>
            </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {loading ? <Skeleton className="h-[340px] w-full" /> : null}
        {!loading && error ? <ErrorPanel message={error} /> : null}
        {!loading && !error && empty ? (
          <EmptyState title={empty.title} message={empty.message} missingFields={empty.missingFields} />
        ) : null}
        {!loading && !error && !empty ? children : null}
      </CardContent>
    </Card>
  );
}
