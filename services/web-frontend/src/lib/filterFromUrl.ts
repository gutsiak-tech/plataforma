import type { FilterState } from "../components/FilterBar";

/** Lê UF e competência da query string (fonte única para Dashboard / links). */
export function filterStateFromSearchParams(searchParams: URLSearchParams): FilterState {
  return {
    uf: searchParams.get("uf") || "PR",
    competencia: searchParams.get("competencia") || "",
  };
}
