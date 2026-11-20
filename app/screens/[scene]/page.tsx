import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SceneView } from "../_components/scenes";
import { SCENE_IDS, SCREEN_SCENES } from "../scenes";

/** 撮影用の固定サイズ画面（#103）。文字は HTML テキストで描く。 */

export const metadata: Metadata = {
  title: "撮影用モック画面",
  // 撮影用の開発ページなので検索には載せない
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SCENE_IDS.map((scene) => ({ scene }));
}

export default async function ScreenPage({ params }: { params: Promise<{ scene: string }> }) {
  const { scene } = await params;
  if (!SCENE_IDS.includes(scene as (typeof SCENE_IDS)[number])) {
    notFound();
  }
  const target = SCREEN_SCENES[scene as keyof typeof SCREEN_SCENES];

  return (
    <>
      {/* 撮影用: 余白とスクロールバーを消して、指定サイズちょうどで撮れるようにする */}
      <style>{"html,body{margin:0;padding:0;overflow:hidden;background:#000}"}</style>
      <div id="screen-frame" style={{ width: target.width, height: target.height }}>
        <SceneView scene={target.id} />
      </div>
    </>
  );
}
