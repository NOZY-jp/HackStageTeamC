import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { FacebookHeader } from "@/components/facebook-like/header";

export const metadata: Metadata = {
  title: {
    default: "HackStage フィード",
    template: "%s | HackStage Facebook風",
  },
  description: "HackStage TeamC の Facebook 風プラットフォーム UI（モックデータ）",
};

export default function FacebookLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}
