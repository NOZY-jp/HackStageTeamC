"use client";

import { AnimatePresence, type DOMKeyframesDefinition, motion, useAnimate } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  type CharacterId,
  EASINGS,
  type MotionSpec,
  type Sprite,
  type StageState,
  type TransitionName,
  toMs,
} from "@/lib/story";
import { BackgroundImage, SpriteImage } from "./asset-image";

/**
 * 舞台（背景・立ち絵・小物・画面効果）。状態は StageState で受け取り、動きは命令で再生する。
 * 統一の見た目は app/globals.css の .sp-* にある。
 */
export type StageHandle = {
  /** 立ち絵・小物（id）か画面全体（"screen"）を動かす。終わったら解決する。対象が無ければすぐ解決する */
  animate: (target: string, spec: MotionSpec, speed: number) => Promise<void>;
  /** 一瞬白く光らせる */
  flash: (ms: number, speed: number) => Promise<void>;
};

/** 立ち絵ごとの動きの指定（出る・消える・移動の時間） */
export type SpriteMotion = { enter?: MotionSpec; exit?: MotionSpec; moveMs?: number };

type Props = {
  stage: StageState;
  backgroundTransition: { name: TransitionName; ms: number };
  spriteMotions: Record<string, SpriteMotion>;
  /** 動きの速さの倍率（スキップ中・動きを減らす設定なら 0） */
  speed: number;
  fullscreen: boolean;
  /** いま話している人。立ち絵があれば、ほかの人の立ち絵を少し暗くする（統一の見た目） */
  speaker?: CharacterId;
  /** 色を重ねる・暗転の時間（ms） */
  effectMs: { tint: number; blackout: number };
  children?: React.ReactNode;
};

function backgroundKey(background: StageState["background"]): string {
  if (!background) return "none";
  return typeof background === "string" ? background : `color:${background.color}`;
}

/**
 * 背景の切り替え方ごとの出入り。消えていく側にも「新しい切り替え方」を使うため、
 * AnimatePresence の custom から切り替え方を受け取る関数にしている。
 */
type BackgroundCustom = { name: TransitionName; seconds: number };
const backgroundVariants = {
  initial: ({ name }: BackgroundCustom) => {
    switch (name) {
      case "slide-left":
        return { x: "100%", opacity: 1 };
      case "slide-right":
        return { x: "-100%", opacity: 1 };
      case "zoom":
        return { opacity: 0, scale: 1.15 };
      default:
        return { opacity: name === "cut" ? 1 : 0 };
    }
  },
  animate: ({ seconds, name }: BackgroundCustom) => ({
    x: "0%",
    opacity: 1,
    scale: 1,
    transition: { duration: name === "cut" ? 0 : seconds },
  }),
  exit: ({ name, seconds }: BackgroundCustom) => {
    const transition = { duration: name === "cut" ? 0 : seconds };
    switch (name) {
      case "slide-left":
        return { x: "-100%", transition };
      case "slide-right":
        return { x: "100%", transition };
      default:
        return { opacity: 0, transition };
    }
  },
};

function toTransition(spec: MotionSpec, speed: number) {
  return {
    duration: (toMs(spec.duration) * speed) / 1000,
    ease: EASINGS[spec.ease ?? "standard"] as never,
    repeat: speed === 0 ? 0 : (spec.repeat ?? 0),
  };
}

/** キーフレームの最初（出るときの initial に使う） */
function firstFrame(spec: MotionSpec) {
  return Object.fromEntries(
    Object.entries(spec.keyframes).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

function SpriteView({
  sprite,
  motion: spriteMotion,
  speed,
  dimmed,
}: {
  sprite: Sprite;
  motion?: SpriteMotion;
  speed: number;
  dimmed: boolean;
}) {
  // 出る動きは「出たときの速さ」で一度だけ決める（あとでスキップを切り替えても、もう一度再生しない）
  const mountEnter = useRef(speed > 0 ? spriteMotion?.enter : undefined).current;
  const exit = spriteMotion?.exit;
  const moveSeconds = ((spriteMotion?.moveMs ?? 0) * speed) / 1000;
  return (
    <motion.div
      className="sp-sprite"
      data-sprite-id={sprite.id}
      style={{ zIndex: sprite.z, height: `${sprite.height}%`, x: "-50%" }}
      initial={{ left: `${sprite.x}%`, top: `${sprite.y}%` }}
      animate={{
        left: `${sprite.x}%`,
        top: `${sprite.y}%`,
        filter: dimmed ? "brightness(0.6)" : "brightness(1)",
      }}
      transition={{ duration: moveSeconds, ease: "easeInOut", filter: { duration: 0.2 * speed } }}
    >
      <motion.div
        className="sp-sprite-inner"
        style={{ scaleX: sprite.flip ? -1 : 1 }}
        initial={mountEnter ? (firstFrame(mountEnter) as never) : false}
        animate={mountEnter ? (mountEnter.keyframes as never) : undefined}
        exit={
          exit && speed > 0
            ? ({ ...exit.keyframes, transition: toTransition(exit, speed) } as never)
            : { opacity: 0, transition: { duration: 0 } }
        }
        transition={mountEnter ? toTransition(mountEnter, speed) : undefined}
      >
        <SpriteImage image={sprite.image} />
      </motion.div>
    </motion.div>
  );
}

const nextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

export const StageView = forwardRef<StageHandle, Props>(function StageView(
  { stage, backgroundTransition, spriteMotions, speed, fullscreen, speaker, effectMs, children },
  ref,
) {
  const [scope, animateElement] = useAnimate();

  useImperativeHandle(ref, () => ({
    async animate(target, spec, factor) {
      const selector =
        target === "screen"
          ? "[data-stage-screen]"
          : `[data-sprite-id="${target}"] .sp-sprite-inner`;
      // 出した直後は、まだ画面に無いことがあるので数フレーム待つ
      for (let tries = 0; tries < 3 && !scope.current?.querySelector(selector); tries += 1) {
        await nextFrame();
      }
      if (!scope.current?.querySelector(selector)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[story] 動かす対象 ${target} が舞台にありません`);
        }
        return;
      }
      await animateElement(
        selector,
        spec.keyframes as DOMKeyframesDefinition,
        toTransition(spec, factor),
      );
    },
    async flash(ms, factor) {
      await animateElement(
        "[data-stage-flash]",
        { opacity: [0, 0.9, 0] },
        { duration: (ms * factor) / 1000 },
      );
    },
  }));

  const throughColor =
    backgroundTransition.name === "black"
      ? "#000"
      : backgroundTransition.name === "white"
        ? "#fff"
        : undefined;
  const custom: BackgroundCustom = {
    name: backgroundTransition.name,
    // 黒・白を経由するときは、消える→出るを順に行うので半分ずつ
    seconds:
      ((throughColor ? backgroundTransition.ms / 2 : backgroundTransition.ms) * speed) / 1000,
  };
  const speakerHasSprite = stage.sprites.some(
    (sprite) => "character" in sprite.image && sprite.image.character === speaker,
  );

  return (
    <div ref={scope} className="sp-stage" data-fullscreen={fullscreen ? "true" : undefined}>
      <div className="sp-screen" data-stage-screen>
        <div
          className="sp-background"
          style={throughColor ? { backgroundColor: throughColor } : undefined}
        >
          <AnimatePresence custom={custom} mode={throughColor ? "wait" : "sync"}>
            {stage.background ? (
              <motion.div
                key={backgroundKey(stage.background)}
                className="sp-fill"
                custom={custom}
                variants={backgroundVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <BackgroundImage background={stage.background} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="sp-sprites">
          <AnimatePresence>
            {stage.sprites.map((sprite) => (
              <SpriteView
                key={sprite.id}
                sprite={sprite}
                motion={spriteMotions[sprite.id]}
                speed={speed}
                dimmed={
                  speakerHasSprite &&
                  "character" in sprite.image &&
                  sprite.image.character !== speaker
                }
              />
            ))}
          </AnimatePresence>
        </div>
        <motion.div
          className="sp-tint"
          initial={false}
          animate={{ backgroundColor: stage.tint ?? "rgba(0,0,0,0)" }}
          transition={{ duration: (effectMs.tint * speed) / 1000 }}
        />
      </div>
      <motion.div
        className="sp-blackout"
        initial={false}
        animate={{ opacity: stage.blackout ? 1 : 0 }}
        transition={{ duration: (effectMs.blackout * speed) / 1000 }}
      />
      <div className="sp-flash" data-stage-flash />
      {children}
    </div>
  );
});
