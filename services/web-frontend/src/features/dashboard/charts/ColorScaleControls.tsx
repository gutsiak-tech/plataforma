type TreemapScaleMode = "global" | "robust" | "custom";

interface ColorScaleControlsProps {
  showToggle?: boolean;
  advancedEnabled: boolean;
  onAdvancedEnabledChange: (value: boolean) => void;
  scaleMode: TreemapScaleMode;
  onScaleModeChange: (mode: TreemapScaleMode) => void;
  globalMin: number;
  globalMax: number;
  robustMin: number;
  robustMax: number;
  customMin: number;
  customMax: number;
  onCustomRangeChange: (next: { min: number; max: number }) => void;
  activeMin: number;
  activeMax: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ColorScaleControls({
  showToggle = true,
  advancedEnabled,
  onAdvancedEnabledChange,
  scaleMode,
  onScaleModeChange,
  globalMin,
  globalMax,
  robustMin,
  robustMax,
  customMin,
  customMax,
  onCustomRangeChange,
  activeMin,
  activeMax,
}: ColorScaleControlsProps) {
  return (
    <div className="mb-3 rounded-xl border border-[var(--dashboard-border)] bg-white px-3 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.03)]">
      {showToggle ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--dashboard-text)]">Advanced color scale</p>
          <button
            type="button"
            role="switch"
            aria-checked={advancedEnabled}
            aria-label="Advanced color scale"
            onClick={() => onAdvancedEnabledChange(!advancedEnabled)}
            className={`focus-ring relative inline-flex h-6 w-11 items-center rounded-full transition ${
              advancedEnabled ? "bg-[var(--dashboard-primary)]" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                advancedEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      ) : null}

      <div className="mb-1 h-2 w-full rounded-full bg-gradient-to-r from-[#440154] via-[#21918c] to-[#fde725]" />
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--dashboard-muted)]">
        <span>{formatBRL(activeMin)}</span>
        <span>{formatBRL(activeMax)}</span>
      </div>

      {advancedEnabled ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--dashboard-text)]">Color scale normalization (Average wage, R$)</p>
          <p className="text-xs text-[var(--dashboard-muted)]">
            This does not filter data — it only changes how colors are mapped.
          </p>
          <p className="text-xs text-[var(--dashboard-muted)]">
            Current scale: {formatBRL(activeMin)} — {formatBRL(activeMax)}
          </p>

          <div className="grid gap-1 text-xs text-[var(--dashboard-text)]">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="treemap-scale-mode"
                checked={scaleMode === "global"}
                onChange={() => onScaleModeChange("global")}
              />
              <span>Global (min–max)</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="treemap-scale-mode"
                checked={scaleMode === "robust"}
                onChange={() => onScaleModeChange("robust")}
              />
              <span>Robust (P5–P95)</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="treemap-scale-mode"
                checked={scaleMode === "custom"}
                onChange={() => onScaleModeChange("custom")}
              />
              <span>Custom (slider)</span>
            </label>
          </div>

          {scaleMode === "custom" ? (
            <div className="grid gap-1 pt-1">
              <input
                aria-label="Custom minimum color scale"
                className="w-full accent-sky-500"
                type="range"
                min={Math.floor(globalMin)}
                max={Math.ceil(globalMax)}
                value={Math.round(customMin)}
                onChange={(e) => {
                  const nextMin = Number(e.target.value);
                  onCustomRangeChange({ min: Math.min(nextMin, customMax - 1), max: customMax });
                }}
              />
              <input
                aria-label="Custom maximum color scale"
                className="w-full accent-emerald-500"
                type="range"
                min={Math.floor(globalMin)}
                max={Math.ceil(globalMax)}
                value={Math.round(customMax)}
                onChange={(e) => {
                  const nextMax = Number(e.target.value);
                  onCustomRangeChange({ min: customMin, max: Math.max(nextMax, customMin + 1) });
                }}
              />
            </div>
          ) : null}

          <p className="pt-1 text-[11px] text-[var(--dashboard-muted)]">
            Global: {formatBRL(globalMin)} — {formatBRL(globalMax)} | Robust: {formatBRL(robustMin)} —{" "}
            {formatBRL(robustMax)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

