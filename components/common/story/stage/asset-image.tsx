"use client";

import {
  type Asset,
  BACKGROUNDS,
  type BackgroundId,
  characters,
  EXPRESSIONS,
  type ImageRef,
  PROPS,
  SPRITES,
} from "@/lib/story";

/**
 * 画像を出す。画像ファイルが未用意（src が無い）なら、名前入りの仮の板を出す。
 * 背景と立ち絵・小物で共通。画像を用意したら lib/story/stage/assets.ts に src を書くだけで差し替わる。
 */
function Placeholder({ label, color, kind }: { label: string; color: string; kind: string }) {
  return (
    <div className="sp-placeholder" data-kind={kind} style={{ backgroundColor: color }}>
      <span className="sp-placeholder-label">{label}</span>
    </div>
  );
}

export function BackgroundImage({ background }: { background: BackgroundId | { color: string } }) {
  if (typeof background !== "string") {
    return <div className="sp-fill" style={{ backgroundColor: background.color }} />;
  }
  const asset: Asset = BACKGROUNDS[background];
  if (asset.solid) {
    return <div className="sp-fill" style={{ backgroundColor: asset.color }} />;
  }
  if (!asset.src) {
    return <Placeholder label={`背景：${asset.label}`} color={asset.color} kind="background" />;
  }
  if (asset.fit === "contain") {
    // 写真は画面を覆わず、縦横比を保ったまま中央に収める（#226）
    return (
      <div className="sp-fill sp-photo">
        {/* biome-ignore lint/performance/noImgElement: 演出の画像は寸法が場面ごとに変わるので素の img で出す */}
        <img className="sp-photo-image" src={asset.src} alt="" />
      </div>
    );
  }
  // biome-ignore lint/performance/noImgElement: 演出の画像は寸法が場面ごとに変わるので素の img で出す
  return <img className="sp-fill sp-cover" src={asset.src} alt="" />;
}

export function SpriteImage({ image }: { image: ImageRef }) {
  if ("character" in image) {
    const expression = image.expression ?? "normal";
    const sprite = SPRITES[image.character];
    const src = sprite.src?.[expression];
    if (!src) {
      return (
        <Placeholder
          label={`${characters[image.character].name}（${EXPRESSIONS[expression]}）`}
          color={sprite.color}
          kind="character"
        />
      );
    }
    // biome-ignore lint/performance/noImgElement: 立ち絵は高さ基準で縮めるので素の img で出す
    return <img className="sp-image" src={src} alt="" />;
  }
  if ("prop" in image) {
    const asset: { label: string; color: string; src?: string } = PROPS[image.prop];
    if (!asset.src) {
      return <Placeholder label={asset.label} color={asset.color} kind="prop" />;
    }
    // biome-ignore lint/performance/noImgElement: 小物も高さ基準で縮めるので素の img で出す
    return <img className="sp-image" src={asset.src} alt="" />;
  }
  // biome-ignore lint/performance/noImgElement: 一覧に無い画像を直接使うとき
  return <img className="sp-image" src={image.src} alt="" />;
}
