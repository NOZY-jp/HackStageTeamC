"use client";

import { useEffect, useState } from "react";
import {
  applyTrigger,
  availableScenes,
  cast,
  castName,
  clearProgress,
  completeScene,
  flags,
  isChoiceAvailable,
  loadProgress,
  PROGRESS_EVENT,
  type Progress,
  replayTranscript,
  saveProgress,
  sceneCount,
  scenes,
  triggers,
} from "@/lib/story";
import { StoryTrigger } from "./story-trigger";

/**
 * シナリオの確認画面（開発・シナリオ確認用）。
 * 進行は localStorage に保存し、履歴は終わった場面と選択肢から組み立て直す。
 */
export function StoryBoard() {
  // SSR では localStorage を読めないので、マウント後に読み込む
  const [progress, setProgress] = useState<Progress | null>(null);
  const [triggerMounted, setTriggerMounted] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // きっかけ部品（StoryTrigger）が別の場所でフラグを立てたら読み直す
  useEffect(() => {
    const reload = () => setProgress(loadProgress());
    window.addEventListener(PROGRESS_EVENT, reload);
    return () => window.removeEventListener(PROGRESS_EVENT, reload);
  }, []);

  if (!progress) {
    return (
      <main className="mx-auto max-w-4xl p-8 text-fg">
        <p role="status">読み込み中…</p>
      </main>
    );
  }

  const update = (next: Progress) => {
    setProgress(next);
    saveProgress(next);
  };

  const reset = () => {
    clearProgress();
    setProgress(loadProgress());
  };

  // 終わりは、完了した場面（Scene.ending）か、選んだ選択肢（SceneChoice.ending）のどちらでも出せる
  const ending =
    scenes.find((scene) => scene.ending && progress.completedScenes.includes(scene.id))?.ending ??
    scenes
      .flatMap((scene) => scene.choices)
      .find((choice) => choice.ending && Object.values(progress.choices).includes(choice.id))
      ?.ending;

  const available = availableScenes(progress);
  const transcript = replayTranscript(progress);
  const done = scenes.filter((scene) => progress.completedScenes.includes(scene.id)).length;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8 text-fg">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">シナリオ確認</h1>
        <p className="text-sm text-fg-muted">
          台本の試作です。きっかけを起こすと場面が始まり、選択肢を選ぶと次へ進みます。
        </p>
        <p className="text-sm" aria-live="polite">
          終わった場面: {done} / {sceneCount}
        </p>
        <div>
          <button
            type="button"
            className="rounded border border-white/20 px-3 py-1 text-sm"
            onClick={reset}
          >
            最初からやり直す
          </button>
        </div>
      </header>

      <section aria-labelledby="story-triggers" className="flex flex-col gap-2">
        <h2 id="story-triggers" className="text-base font-semibold">
          きっかけ
        </h2>
        <p className="text-sm text-fg-muted">
          本来は各画面に置く部品です。ここでは手で起こします。
        </p>
        <ul className="flex flex-col gap-2">
          {triggers.map((trigger) => {
            const fired = trigger.setsFlags.every((flag) => progress.flags.includes(flag));
            return (
              <li key={trigger.id} className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded border border-white/20 px-3 py-1 text-sm disabled:opacity-50"
                  disabled={fired}
                  onClick={() => {
                    update(applyTrigger(progress, trigger));
                  }}
                >
                  {trigger.label}
                </button>
                <span className="text-xs text-fg-muted">{trigger.description}</span>
                {fired ? <span className="text-xs">済</span> : null}
              </li>
            );
          })}
        </ul>
      </section>

      {ending ? (
        <section
          aria-labelledby="story-ending"
          className="rounded border border-white/25 bg-white/5 p-4"
        >
          <h2 id="story-ending" className="text-base font-semibold">
            結末
          </h2>
          <p role="status" className="mt-1 text-sm font-semibold">
            {ending}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            ここで物語は終わりです（住所そのものは作りません）。
          </p>
        </section>
      ) : null}

      <section aria-labelledby="story-now" className="flex flex-col gap-3">
        <h2 id="story-now" className="text-base font-semibold">
          いま始められる場面
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-fg-muted">
            きっかけを起こすと場面が始まります（すべて終わっていれば履歴を見てください）。
          </p>
        ) : (
          available.map((scene) => (
            <article key={scene.id} className="rounded border border-white/10 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                {scene.chapter}：{scene.title}
              </h3>
              <ol className="mb-3 flex flex-col gap-1">
                {scene.lines.map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 台本は固定で並び替えない
                  <li key={index} className="text-sm">
                    <span className="font-semibold">{castName(line.speakerId)}</span>
                    <span className="text-fg-muted">「{line.text}」</span>
                  </li>
                ))}
              </ol>
              {(() => {
                // 寄り道の選択肢を選んだ直後は、その場面に残ったまま反応を出す
                const picked = scene.choices.find(
                  (choice) => choice.id === progress.choices[scene.id],
                );
                if (!picked?.replyLines?.length) {
                  return null;
                }
                return (
                  <ol className="mb-2 flex flex-col gap-1" aria-label="いまの反応">
                    {picked.replyLines.map((line, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: 台本は固定で並び替えない
                      <li key={`now-${index}`} className="text-sm">
                        <span className="font-semibold">{castName(line.speakerId)}</span>
                        <span className="text-fg-muted">「{line.text}」</span>
                      </li>
                    ))}
                  </ol>
                );
              })()}
              {scene.choices.length === 0 ? (
                <button
                  type="button"
                  className="rounded bg-white/10 px-3 py-1 text-sm"
                  onClick={() => {
                    update(completeScene(progress, scene));
                  }}
                >
                  この場面を終える
                </button>
              ) : null}
              <fieldset
                aria-label={`${scene.title} の選択肢`}
                className="flex flex-wrap gap-2 border-0 p-0"
              >
                {scene.choices.map((choice) => {
                  // 選択肢ごとのゲート（例: 「でんちゃん」を見つけるまでカイに相談できない）
                  const selectable = isChoiceAvailable(progress, choice);
                  return (
                    <span key={choice.id} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded bg-white/10 px-3 py-1 text-sm disabled:opacity-50"
                        disabled={!selectable}
                        title={selectable ? undefined : "まだ選べません"}
                        onClick={() => {
                          update(completeScene(progress, scene, choice.id));
                        }}
                      >
                        {choice.label}
                      </button>
                      {selectable ? null : (
                        <span className="text-xs text-fg-muted">（まだ選べません）</span>
                      )}
                    </span>
                  );
                })}
              </fieldset>
            </article>
          ))
        )}
      </section>

      <section aria-labelledby="story-log" className="flex flex-col gap-3">
        <h2 id="story-log" className="text-base font-semibold">
          カイとの会話（履歴）
        </h2>
        {transcript.length === 0 ? (
          <p className="text-sm text-fg-muted">まだ会話はありません。</p>
        ) : (
          transcript.map((entry) => (
            <article key={entry.sceneId} className="rounded border border-white/10 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                {entry.chapter}：{entry.title}
              </h3>
              <ol className="flex flex-col gap-1">
                {entry.lines.map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 台本は固定で並び替えない
                  <li key={index} className="text-sm">
                    <span className="font-semibold">{castName(line.speakerId)}</span>
                    <span className="text-fg-muted">「{line.text}」</span>
                  </li>
                ))}
              </ol>
              {entry.choice ? (
                <p className="mt-2 text-xs text-fg-muted">選んだ答え: {entry.choice.label}</p>
              ) : null}
              {entry.replyLines?.length ? (
                <ol className="mt-1 flex flex-col gap-1">
                  {entry.replyLines.map((line, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 台本は固定で並び替えない
                    <li key={`reply-${index}`} className="text-sm">
                      <span className="font-semibold">{castName(line.speakerId)}</span>
                      <span className="text-fg-muted">「{line.text}」</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          ))
        )}
      </section>

      <section aria-labelledby="story-part" className="flex flex-col gap-2">
        <h2 id="story-part" className="text-base font-semibold">
          きっかけ部品（各画面に置くもの）
        </h2>
        <p className="text-sm text-fg-muted">
          画面に <code>&lt;StoryTrigger triggerId="..." /&gt;</code>{" "}
          を置くと、開いたときにフラグが立ちます。
        </p>
        {triggerMounted ? (
          <StoryTrigger triggerId="open-mylist">
            <p className="text-xs text-fg-muted">部品を置きました（open-mylist を発火）</p>
          </StoryTrigger>
        ) : (
          <div>
            <button
              type="button"
              className="rounded border border-white/20 px-3 py-1 text-sm"
              onClick={() => setTriggerMounted(true)}
            >
              部品を置いてみる（open-mylist）
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="story-flags" className="flex flex-col gap-2">
        <h2 id="story-flags" className="text-base font-semibold">
          見つけたこと（フラグ）
        </h2>
        <ul className="flex flex-wrap gap-2">
          {flags.map((flag) => {
            const found = progress.flags.includes(flag.id);
            return (
              <li
                key={flag.id}
                className="rounded-full border border-white/15 px-3 py-1 text-xs"
                data-found={found ? "true" : undefined}
              >
                {flag.label}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="story-cast" className="flex flex-col gap-2">
        <h2 id="story-cast" className="text-base font-semibold">
          人物の台帳
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-1">表示名</th>
              <th className="py-1">一人称</th>
              <th className="py-1">役割</th>
              <th className="py-1">アカウント</th>
              <th className="py-1">昔の呼び方</th>
            </tr>
          </thead>
          <tbody>
            {cast.map((member) => (
              <tr key={member.id} className="border-b border-white/5 align-top">
                <td className="py-1 font-semibold">
                  {member.displayName}
                  {member.nickname ? `（${member.nickname}）` : ""}
                </td>
                <td className="py-1">{member.pronoun}</td>
                <td className="py-1">{member.role}</td>
                <td className="py-1">
                  {member.accounts.map((account) => (
                    <span
                      key={`${member.id}-${account.platform}-${account.handle}`}
                      className="mr-2 text-xs"
                    >
                      {account.platform}: {account.handle}
                      {account.displayName ? `（${account.displayName}）` : ""}
                    </span>
                  ))}
                </td>
                <td className="py-1">
                  {member.oldNames.length === 0
                    ? "—"
                    : member.oldNames
                        .map((old) => {
                          const knownBy = old.knownBy.map((id) => castName(id)).join("・");
                          const basis = knownBy || old.source || "";
                          return basis ? `${old.name}（${basis}）` : old.name;
                        })
                        .join("、")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
