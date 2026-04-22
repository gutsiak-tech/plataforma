import type { PropsWithChildren } from "react";

export function PageShell({ children }: PropsWithChildren) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-6 md:px-8 md:py-8">
      {children}
    </main>
  );
}

