interface EmptyStateProps {
  title: string;
  message: string;
  missingFields?: string[];
}

export function EmptyState({ title, message, missingFields }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-panel/40 p-4 text-sm text-muted">
      <p className="font-semibold text-text">{title}</p>
      <p className="mt-1">{message}</p>
      {missingFields && missingFields.length > 0 ? (
        <p className="mt-2 text-amber-300">Campos ausentes/insuficientes: {missingFields.join(", ")}</p>
      ) : null}
    </div>
  );
}
