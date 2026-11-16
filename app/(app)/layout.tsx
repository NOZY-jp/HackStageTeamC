import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ServerRail } from "@/components/server-rail";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rail={
        // usePathname は未知の動的パラメータ配下で suspend するため、
        // cacheComponents ではレールを境界で囲む（fallback は同じ幅の空レール）
        <Suspense fallback={<div className="app-rail" aria-hidden="true" />}>
          <ServerRail />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
