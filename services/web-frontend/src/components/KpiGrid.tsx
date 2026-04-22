import type { PropsWithChildren } from "react";

export function KpiGrid({ children }: PropsWithChildren) {
  return <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</section>;
}

