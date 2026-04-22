import { motion } from "framer-motion";

export type KpiKind = "total" | "mean" | "median" | "p90" | "countries";

interface KpiCardProps {
  title: string;
  value: string;
  kind: KpiKind;
  subtitle?: string;
}

function KpiGlyph({ kind }: { kind: KpiKind }) {
  const svgClass = "h-[60px] w-[60px]";

  if (kind === "total") {
    return (
      <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8M8 13h5M8 17h8" />
      </svg>
    );
  }
  if (kind === "mean") {
    return (
      <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 15.5 9 10l3 3 7-7" />
        <path d="M18 6h2v2" />
        <path d="M4 19h16" />
      </svg>
    );
  }
  if (kind === "median") {
    return (
      <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 18V9M12 18V6M19 18v-5" />
        <path d="M3 18h18" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "p90") {
    return (
      <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 18h14" />
        <path d="M8 18v-4M12 18V8M16 18v-7" />
        <path d="M5 7c1.5-1.2 3.1-1.8 5-1.8 2.6 0 4.5 1.1 6.2 3.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a11 11 0 0 1 0 16M12 4a11 11 0 0 0 0 16M4 12h16" />
    </svg>
  );
}

const iconPalette: Record<KpiKind, { blob: string; icon: string }> = {
  total: { blob: "from-sky-300/80 to-sky-200/80", icon: "text-sky-700" },
  mean: { blob: "from-emerald-300/80 to-emerald-200/80", icon: "text-emerald-700" },
  median: { blob: "from-indigo-300/80 to-indigo-200/80", icon: "text-indigo-700" },
  p90: { blob: "from-amber-300/80 to-amber-200/80", icon: "text-amber-700" },
  countries: { blob: "from-violet-300/80 to-violet-200/80", icon: "text-violet-700" },
};

export function IconFactory({ kind }: { kind: KpiKind }) {
  const palette = iconPalette[kind];
  return (
    <motion.div
      className={`relative grid h-[72px] w-[72px] place-items-center bg-gradient-to-br ${palette.blob}`}
      style={{ borderRadius: "42% 58% 62% 38% / 42% 38% 62% 58%" }}
      whileHover={{ y: -3, rotate: -2, scale: 1.04 }}
      whileTap={{ y: -1, rotate: 1, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 bg-white/50"
        style={{ borderRadius: "42% 58% 62% 38% / 42% 38% 62% 58%" }}
        whileHover={{ scale: [1, 1.04, 1], rotate: [0, 2, -1, 0] }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      <motion.div
        className={`relative ${palette.icon}`}
        whileHover={{ y: -1.5, rotate: 4, scale: 1.08 }}
        whileTap={{ y: 0, scale: 0.97 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <KpiGlyph kind={kind} />
      </motion.div>
    </motion.div>
  );
}

export function KpiCard({ title, value, kind, subtitle }: KpiCardProps) {
  return (
    <article className="group flex items-start gap-4 rounded-xl bg-transparent p-2">
      <div className="shrink-0">
        <IconFactory kind={kind} />
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className="text-[0.98rem] font-semibold leading-tight text-[var(--dashboard-text)]">{title}</p>
        {subtitle ? <p className="text-sm leading-relaxed text-[var(--dashboard-muted)]">{subtitle}</p> : null}
        <p className="truncate text-[1.8rem] font-bold leading-none text-[var(--dashboard-text)]">{value}</p>
      </div>
    </article>
  );
}

export { KpiCard as KPICard };

