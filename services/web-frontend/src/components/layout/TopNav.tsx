import { Link, useLocation } from "react-router-dom";

interface TopNavProps {
  uf: string;
  competencia?: string;
}

export function TopNav({ uf, competencia }: TopNavProps) {
  const location = useLocation();
  const isMap = location.pathname === "/map";
  const query = `uf=${encodeURIComponent(uf)}${competencia ? `&competencia=${encodeURIComponent(competencia)}` : ""}`;
  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 border-b border-[var(--dashboard-border)] ${
        isMap ? "bg-slate-200" : "bg-slate-200/75 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1360px] items-center justify-between px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <div className="truncate text-sm font-bold text-[var(--dashboard-text)] md:text-base">Plataforma PADF</div>
          <nav className="flex items-center gap-2">
            <Link
              className={`focus-ring rounded-full border border-[var(--dashboard-border)] px-4 py-1.5 text-sm font-semibold transition ${
                !isMap ? "bg-violet-500 text-white hover:bg-violet-600" : "bg-white text-[var(--dashboard-text)] hover:bg-slate-50"
              }`}
              to={`/dashboard?${query}`}
            >
              Dashboard
            </Link>
            <Link
              className={`focus-ring rounded-full border border-[var(--dashboard-border)] px-4 py-1.5 text-sm font-semibold transition ${
                isMap ? "bg-[var(--dashboard-primary)] text-white hover:bg-[#1d4ed8]" : "bg-white text-[var(--dashboard-text)] hover:bg-slate-50"
              }`}
              to={`/map?${query}`}
            >
              Mapa
            </Link>
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="focus-ring rounded-full border border-[var(--dashboard-border)] bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Exportar
          </button>
          <button
            type="button"
            className="focus-ring rounded-full border border-[var(--dashboard-border)] bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ajuda
          </button>
        </div>
      </div>
    </header>
  );
}

