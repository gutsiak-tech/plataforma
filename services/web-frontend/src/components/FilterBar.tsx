import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useAvailableCompetencias, useAvailableUFs } from "../lib/query/hooks";
import { cn } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ErrorPanel } from "./common/ErrorPanel";

/** Valor interno do Radix Select quando não há competência na lista (não exibir literalmente na UI). */
const COMPETENCIA_EMPTY_SENTINEL = "__none__";

export interface FilterState {
  uf: string;
  competencia: string;
}

interface FilterBarProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
  onCompetenciaChangeForMap?: (uf: string, competencia: string) => void;
  showMapHint?: boolean;
  className?: string;
  inline?: boolean;
  extraControls?: ReactNode;
}

export function FilterBar({
  value,
  onChange,
  onCompetenciaChangeForMap,
  showMapHint = false,
  className,
  inline = false,
  extraControls,
}: FilterBarProps) {
  const qUfs = useAvailableUFs();
  const qCompetencias = useAvailableCompetencias();

  const ufs = qUfs.data ?? [];
  const competencias = qCompetencias.data ?? [];
  const loading = qUfs.isLoading || qCompetencias.isLoading;
  const metaError = (qUfs.error as Error | null)?.message ?? (qCompetencias.error as Error | null)?.message ?? null;

  const defaultValue = useMemo(
    () => ({
      uf: ufs.length ? ufs[0] : "PR",
      competencia: competencias.length ? competencias[competencias.length - 1] : "",
    }),
    [ufs, competencias]
  );

  useEffect(() => {
    if (!value.uf || !value.competencia || value.competencia === COMPETENCIA_EMPTY_SENTINEL) {
      const next = {
        uf: value.uf || defaultValue.uf,
        competencia:
          !value.competencia || value.competencia === COMPETENCIA_EMPTY_SENTINEL
            ? defaultValue.competencia
            : value.competencia,
      };
      if (next.uf === value.uf && next.competencia === value.competencia) return;
      onChange(next);
    }
  }, [defaultValue.competencia, defaultValue.uf, onChange, value.competencia, value.uf]);

  const currentUf = value.uf || (ufs[0] ?? "PR");
  const currentCompetenciaRaw = value.competencia || (competencias[competencias.length - 1] ?? "");
  const currentCompetencia = currentCompetenciaRaw === COMPETENCIA_EMPTY_SENTINEL ? "" : currentCompetenciaRaw;
  const isEmpty = ufs.length === 0 && competencias.length === 0 && !loading;

  const handleUfChange = (uf: string) => {
    const next = { uf, competencia: currentCompetencia };
    onChange(next);
    if (showMapHint && onCompetenciaChangeForMap) onCompetenciaChangeForMap(uf, currentCompetencia);
  };

  const handleCompetenciaChange = (competencia: string) => {
    if (competencia === COMPETENCIA_EMPTY_SENTINEL) return;
    const next = { uf: currentUf, competencia };
    onChange(next);
    if (showMapHint && onCompetenciaChangeForMap) onCompetenciaChangeForMap(currentUf, competencia);
  };

  if (loading) return <div className="text-sm text-muted">Carregando filtros...</div>;

  return (
    <div className={cn("space-y-3", className)}>
      {metaError ? <ErrorPanel title="Falha ao carregar filtros" message={metaError} /> : null}
      {isEmpty && !metaError ? (
        <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted" role="status">
          Nenhum dado disponível. Execute o loader e confira /api/debug/counts.
        </div>
      ) : null}
      <div className={cn("flex flex-wrap items-end gap-3", inline ? "md:flex-nowrap" : "")}>
        <div className="min-w-[130px] flex-1 space-y-1 md:max-w-[180px]">
          <label className={cn("text-xs", inline ? "font-semibold text-[var(--dashboard-muted)]" : "text-muted")}>UF</label>
          <Select value={currentUf} onValueChange={handleUfChange} disabled={ufs.length === 0}>
            <SelectTrigger
              aria-label="Selecionar UF"
              className={cn(
                inline
                  ? "h-10 rounded-[var(--dashboard-radius-input)] border-[var(--dashboard-border)] bg-white text-[var(--dashboard-text)]"
                  : undefined
              )}
            >
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {(ufs.length ? ufs : ["PR"]).map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[190px] flex-1 space-y-1 md:max-w-[220px]">
          <label className={cn("text-xs", inline ? "font-semibold text-[var(--dashboard-muted)]" : "text-muted")}>
            Competência
          </label>
          <Select
            value={currentCompetencia || COMPETENCIA_EMPTY_SENTINEL}
            onValueChange={handleCompetenciaChange}
            disabled={competencias.length === 0}
          >
            <SelectTrigger
              aria-label="Selecionar competência"
              className={cn(
                inline
                  ? "h-10 rounded-[var(--dashboard-radius-input)] border-[var(--dashboard-border)] bg-white text-[var(--dashboard-text)]"
                  : undefined
              )}
            >
              <SelectValue placeholder="Competência" />
            </SelectTrigger>
            <SelectContent>
              {(competencias.length ? competencias : [COMPETENCIA_EMPTY_SENTINEL]).map((c) => (
                <SelectItem key={c || "empty"} value={c}>
                  {c === COMPETENCIA_EMPTY_SENTINEL ? "—" : c || "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {extraControls}
      </div>
    </div>
  );
}
