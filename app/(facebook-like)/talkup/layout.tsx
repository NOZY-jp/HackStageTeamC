import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { FacebookHeader } from "@/components/facebook-like/header";

export const metadata: Metadata = {
  title: {
    default: "talkup",
    template: "%s | talkup",
  },
  description: "talkup で、友達や知り合いとつながろう。",
};

export default function FacebookLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="fb-shell" />}>
      <FacebookProvider>
        <div className="fb-shell">
          <Suspense fallback={<div className="fb-header" />}>
            <FacebookHeader />
          </Suspense>
          <main className="fb-main">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
      </FacebookProvider>
    </Suspense>
  );
}
