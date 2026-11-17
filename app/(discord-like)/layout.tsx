import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/discord-like/app-shell";
import { ServerRail } from "@/components/discord-like/server-rail";
import { SidebarUserPanel } from "@/components/discord-like/sidebar-user-panel";
import { LocalMessagesProvider } from "./_components/local-messages-context";
import { SELF_USER_ID } from "./_components/self-user";
import { VoiceProvider } from "./_components/voice-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <VoiceProvider>
      <LocalMessagesProvider>
        <AppShell
          rail={
            // usePathname は未知の動的パラメータ配下で suspend するため、
            // cacheComponents ではレールを境界で囲む（fallback は同じ幅の空レール）
            <Suspense fallback={<div className="app-rail" aria-hidden="true" />}>
              <ServerRail />
            </Suspense>
          }
          leftFooter={<SidebarUserPanel userId={SELF_USER_ID} />}
        >
          {children}
        </AppShell>
      </LocalMessagesProvider>
    </VoiceProvider>
  );
}
