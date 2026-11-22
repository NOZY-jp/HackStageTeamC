"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import type { CustomCueName } from "@/lib/story";

/**
 * カスタム演出（自由にするもの）。場面の custom("名前", props) で呼ばれる。
 * 部品は props と onDone を受け取り、終わったら onDone を呼ぶ（wait: true の場面は onDone まで待つ）。
 * 新しく足すときは lib/story/stage/custom.ts に名前を足し、ここに部品を登録する（登録漏れは型エラーになる）。
 * 動きは Motion（motion/react）で自由に書いてよい。スキップ中は instant が true になるので、すぐ onDone を呼ぶ。
 */
export type CustomCueProps = {
  props: Record<string, unknown>;
  onDone: () => void;
  /** スキップ中など、演出を省くとき */
  instant: boolean;
};

function PhoneScreen({ props, onDone, instant }: CustomCueProps) {
  const messages = Array.isArray(props.messages) ? props.messages.map(String) : [];
  const [shown, setShown] = useState(instant ? messages.length : 0);

  useEffect(() => {
    if (instant) {
      onDone();
      return;
    }
    if (shown >= messages.length) {
      return;
    }
    const timer = window.setTimeout(() => setShown((count) => count + 1), 700);
    return () => window.clearTimeout(timer);
  }, [shown, messages.length, instant, onDone]);

  return (
    <motion.div
      className="sp-phone"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40 }}
    >
      <div className="sp-phone-screen">
        <AnimatePresence>
          {messages.slice(0, shown).map((message, index) => (
            <motion.p
              // biome-ignore lint/suspicious/noArrayIndexKey: メッセージは順に増えるだけ
              key={index}
              className="sp-phone-message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {message}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
      {shown >= messages.length ? (
        <button type="button" className="sw-tool sp-phone-close" onClick={onDone}>
          閉じる
        </button>
      ) : null}
    </motion.div>
  );
}

function BigText({ props, onDone, instant }: CustomCueProps) {
  const text = typeof props.text === "string" ? props.text : "";
  const ms = typeof props.duration === "number" ? props.duration : 1600;

  useEffect(() => {
    const timer = window.setTimeout(onDone, instant ? 0 : ms);
    return () => window.clearTimeout(timer);
  }, [instant, ms, onDone]);

  return (
    <motion.p
      className="sp-big-text"
      initial={{ opacity: 0, letterSpacing: "0.6em" }}
      animate={{ opacity: 1, letterSpacing: "0.2em" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {text}
    </motion.p>
  );
}

const LOOK_TRANSITION = { delay: 0.6, duration: 0.6 };

/**
 * 絵を見せて、押すまで待つ。画面全体を押せる面にして、押す・Enter・Space で次へ。
 * 文章の窓は look() が先に隠している。右下に小さく「押すと続く」印だけを出す
 */
function Look({ onDone, instant }: CustomCueProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (instant) {
      onDone();
      return;
    }
    // 表示が落ち着くまで、クリックとキー操作の両方を待たせる
    const timer = window.setTimeout(
      () => setReady(true),
      (LOOK_TRANSITION.delay + LOOK_TRANSITION.duration) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [instant, onDone]);

  useEffect(() => {
    if (!ready || instant) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!event.repeat) onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, instant, onDone]);

  return (
    <motion.button
      type="button"
      className="sp-look"
      aria-label="続ける"
      disabled={!ready || instant}
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={LOOK_TRANSITION}
    >
      <span className="sp-look-hint" aria-hidden="true">
        ▼
      </span>
    </motion.button>
  );
}

export const CUSTOM_CUE_COMPONENTS: Record<CustomCueName, ComponentType<CustomCueProps>> = {
  "phone-screen": PhoneScreen,
  "big-text": BigText,
  look: Look,
};
