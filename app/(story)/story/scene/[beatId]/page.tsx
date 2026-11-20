import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScenePreview } from "@/app/(story)/_components/scene-preview";
import { storyConsoleEnabled } from "@/app/(story)/_components/story-gate";
import { beats } from "@/lib/story";

export const metadata: Metadata = {
  title: "場面の再生（開発用）",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return beats.map((beat) => ({ beatId: beat.id }));
}

async function Preview({ params }: { params: PageProps<"/story/scene/[beatId]">["params"] }) {
  const { beatId } = await params;
  if (!beats.some((beat) => beat.id === beatId)) {
    notFound();
  }
  return <ScenePreview beatId={beatId} />;
}

/** 場面を1つだけ再生する（進行状態は変えない）。場面を作ったらここで見る */
export default function ScenePreviewPage({ params }: PageProps<"/story/scene/[beatId]">) {
  if (!storyConsoleEnabled()) {
    notFound();
  }
  return (
    <Suspense fallback={null}>
      <Preview params={params} />
    </Suspense>
  );
}
