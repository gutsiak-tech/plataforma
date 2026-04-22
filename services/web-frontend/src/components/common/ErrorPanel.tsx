interface ErrorPanelProps {
  title?: string;
  message: string;
  details?: string;
}

export function ErrorPanel({ title = "Falha ao carregar dados", message, details }: ErrorPanelProps) {
  return (
    <div className="rounded-lg border border-danger/60 bg-danger/10 p-4 text-sm text-red-200" role="alert">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
      {details ? <pre className="mt-2 whitespace-pre-wrap text-xs text-red-300">{details}</pre> : null}
    </div>
  );
}
