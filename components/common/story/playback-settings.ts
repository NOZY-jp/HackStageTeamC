"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PLAYBACK,
  PLAYBACK_MODE_LABELS,
  type PlaybackSettings,
  TEXT_SPEED_LABELS,
} from "@/lib/story";

/** 進み方の設定。進行状態（hackstage:story:v1）とは別に保存する（やり直しても消えない） */
const STORAGE_KEY = "hackstage:story-playback:v1";

function load(): PlaybackSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PLAYBACK;
    }
    const parsed = JSON.parse(raw) as Partial<PlaybackSettings>;
    return {
      mode:
        parsed.mode && parsed.mode in PLAYBACK_MODE_LABELS ? parsed.mode : DEFAULT_PLAYBACK.mode,
      speed:
        parsed.speed && parsed.speed in TEXT_SPEED_LABELS ? parsed.speed : DEFAULT_PLAYBACK.speed,
    };
  } catch {
    return DEFAULT_PLAYBACK;
  }
}

export function usePlaybackSettings(): [PlaybackSettings, (next: PlaybackSettings) => void] {
  const [settings, setSettings] = useState<PlaybackSettings>(DEFAULT_PLAYBACK);

  useEffect(() => {
    setSettings(load());
  }, []);

  const update = useCallback((next: PlaybackSettings) => {
    setSettings(next);
    try {
      // スキップは保存しない（次に開いたとき、読んでいない台本を飛ばしてしまわないように）
      const saved: PlaybackSettings = { ...next, mode: next.mode === "skip" ? "click" : next.mode };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // 保存できなくても、開いているあいだは使える
    }
  }, []);

  return [settings, update];
}

/** 動きを減らす設定（文字送りをしない） */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
