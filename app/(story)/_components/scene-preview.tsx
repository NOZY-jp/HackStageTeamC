"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlaybackSettings } from "@/components/common/story/playback-settings";
import { requestScenePreview } from "@/components/common/story/scene-preview-request";
import { ScenePlayer } from "@/components/common/story/stage/scene-player";
import { LogPanel, useRestoreKeys } from "@/components/common/story/story-stage";
import type { Line } from "@/lib/story";
import { beats, PLACES, validateBeat } from "@/lib/story";

/** 場面を単体で再生する。フラグや進行状態には触らない（何度でも頭から見られる） */
export function ScenePreview({ beatId }: { beatId: string }) {
  const beat = beats.find((candidate) => candidate.id === beatId);
  const [settings, setSettings] = usePlaybackSettings();
  const [round, setRound] = useState(0);
  const [done, setDone] = useState<string | undefined>();
  const [logOpen, setLogOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [minimized, setMinimized] = useState(false);
  const router = useRouter();
  useRestoreKeys(minimized, () => setMinimized(false));
  // 起きる画面がある場面（Discord の通話など）は、その画面に移って、実物の上で流す
  const place = beat?.place ? PLACES[beat.place] : undefined;
  useEffect(() => {
    if (beat && place) {
      requestScenePreview(beat.id);
      router.replace(place.href);
    }
  }, [beat, place, router]);
  if (!beat) {
    return null;
  }
  if (place) {
    return (
      <div className="st-preview">
        <header className="st-preview-bar">
          <Link href="/story">← 進行チェックへ</Link>
          <code>{beat.id}</code>
          <span>{place.label} の上で再生します…</span>
        </header>
      </div>
    );
  }
  const issues = validateBeat(beat);

  return (
    <div className="st-preview">
      <header className="st-preview-bar">
        <Link href="/story">← 進行チェックへ</Link>
        <code>{beat.id}</code>
        <button
          type="button"
          className="st-secondary"
          onClick={() => {
            setDone(undefined);
            setMinimized(false);
            setRound((value) => value + 1);
          }}
        >
          頭から再生
        </button>
        {issues.length > 0 ? (
          <span className="st-badge" data-kind="todo">
            書き間違い {issues.length}件: {issues.map((issue) => issue.message).join(" / ")}
          </span>
        ) : null}
        {done !== undefined ? (
          <span className="st-badge" data-kind="done">
            {done}
          </span>
        ) : null}
      </header>
      <div className="sw-stage">
        {minimized && done === undefined ? (
          <div
            className="sw-veil"
            aria-hidden="true"
            data-minimized="true"
            onClick={() => setMinimized(false)}
          />
        ) : null}
        {logOpen ? (
          <LogPanel
            onClose={() => setLogOpen(false)}
            current={{ beatId: beat.id, chapter: beat.chapter, lines }}
          />
        ) : null}
        <div className="sw-dock">
          {done === undefined ? (
            <ScenePlayer
              key={round}
              beat={beat}
              settings={settings}
              onSettingsChange={setSettings}
              onComplete={(_, choiceId) =>
                setDone(choiceId ? `場面が終わりました（選択: ${choiceId}）` : "場面が終わりました")
              }
              onFlag={() => {}}
              onMinimize={() => setMinimized(true)}
              minimized={minimized}
              onOpenLog={() => setLogOpen(true)}
              onShownLinesChange={setLines}
              label="単体再生"
              rememberPosition={false}
            />
          ) : null}
          {done === undefined && minimized ? (
            <div className="sw-tab" role="status">
              <button type="button" className="sw-tab-open" onClick={() => setMinimized(false)}>
                <span className="sw-tab-badge">たたみ中</span>
                ストーリーを開く
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
