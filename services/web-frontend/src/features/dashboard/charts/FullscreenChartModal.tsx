import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface FullscreenChartModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
  children?: ReactNode;
}

export function FullscreenChartModal({
  isOpen,
  title,
  subtitle,
  onClose,
  returnFocusTo,
  children,
}: FullscreenChartModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const rafId = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    const timeoutId = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 180);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current && returnFocusTo) {
      returnFocusTo.focus();
      wasOpenRef.current = false;
    }
  }, [isOpen, returnFocusTo]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] bg-slate-900/45 p-3 backdrop-blur-[2px] md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="mx-auto flex h-[85vh] w-[95vw] max-w-[1600px] flex-col rounded-[var(--dashboard-radius-card)] border border-[var(--dashboard-border)] bg-[var(--dashboard-card)] shadow-[0_24px_80px_rgba(15,23,42,0.32)] md:h-[85vh] md:w-[90vw]"
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--dashboard-border)] px-4 py-3 md:px-5">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-[var(--dashboard-text)] md:text-lg">{title}</h2>
                {subtitle ? <p className="mt-1 truncate text-xs text-[var(--dashboard-muted)]">{subtitle}</p> : null}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close expanded chart"
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--dashboard-muted)] transition hover:bg-slate-100 hover:text-[var(--dashboard-text)]"
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            <div className="min-h-0 flex-1 p-3 md:p-5">{children}</div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

