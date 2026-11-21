"use client";

import Link from "next/link";
import { useStory } from "@/components/common/story/story-provider";
import {
  BACKGROUNDS,
  beats,
  CHAPTER_TITLES,
  CUSTOM_CUES,
  characters,
  currentChapter,
  EXPRESSIONS,
  FRAMES,
  flagLabel,
  MOTIONS,
  missingFor,
  nicknames,
  POSITIONS,
  PROPS,
  steps,
  TRANSITIONS,
  textsOf,
  validateBeat,
} from "@/lib/story";

/**
 * 進行チェック（開発用）。ゲームの画面ではない。
 * 左: 謎解きの段階（#76）／中: 場面の一覧と単体再生／右: 人物と、統一の部品の一覧
 */
export function StoryConsole() {
  const { state, setFlag, reset, ready } = useStory();
  const chapter = currentChapter(state);

  return (
    <div className="st-shell">
      <header className="st-header">
        <h1 className="st-title">進行チェック（開発用）</h1>
        <p className="st-chapter">
          いまの章：第{chapter}章 {CHAPTER_TITLES[chapter] ?? ""}
        </p>
        <p className="st-help">
          ゲームの画面ではありません。場面の再生と、謎解きの手がかりがそろっているかを確かめる画面です。
        </p>
        <button type="button" className="st-reset" onClick={reset}>
          進行状態を消す
        </button>
      </header>

      <div className="st-layout">
        <section className="st-panel" aria-labelledby="st-steps">
          <h2 id="st-steps" className="st-panel-title">
            謎解きの段階（正本 #76）
          </h2>
          <p className="st-help">「着いた」を押すと、その段階に着いたことにします。</p>
          <ol className="st-steps">
            {steps.map((step) => {
              const reached = state.flags.includes(step.id);
              return (
                <li key={step.id} className="st-step" data-reached={reached ? "true" : undefined}>
                  <p className="st-step-head">
                    <span className="st-step-order">{step.order}</span>
                    <span>第{step.chapter}章</span>
                    {step.status.done ? (
                      <span className="st-badge" data-kind="done">
                        手がかり実装済み
                      </span>
                    ) : (
                      <span className="st-badge" data-kind="todo">
                        未実装: {step.status.issue}
                      </span>
                    )}
                  </p>
                  <p>{step.summary}</p>
                  <ul className="st-places">
                    {step.places.map((place) => (
                      <li key={place.label}>
                        {place.platform}：
                        {place.href ? (
                          <Link href={place.href} target="_blank">
                            {place.label}
                          </Link>
                        ) : (
                          place.label
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="st-trigger"
                    disabled={!ready || reached}
                    onClick={() => setFlag(step.id)}
                  >
                    {reached ? "着いた ✓" : "着いた"}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <main className="st-main">
          <h2 className="st-panel-title">場面</h2>
          <p className="st-help">
            「再生」で場面を1つだけ流します（進行状態は変わりません）。ゲームの中では、条件がそろうと画面下に流れます。
          </p>
          <ul className="st-scenes">
            {beats.map((beat) => {
              const issues = validateBeat(beat);
              const texts = textsOf(beat.script);
              const todos = texts.filter((cue) => cue.todo || cue.text === "").length;
              const missing = missingFor(state, beat);
              const status = beat.previewOnly
                ? "見本（ゲームでは流れない）"
                : state.completed.includes(beat.id)
                  ? "済み"
                  : missing.flags.length + missing.beats.length === 0
                    ? "次に流れる"
                    : `待ち：${[...missing.flags.map(flagLabel), ...missing.beats].join(" / ")}`;
              return (
                <li key={beat.id} className="st-scene">
                  <p className="st-step-head">
                    <code>{beat.id}</code>
                    <span>{beat.layout === "fullscreen" ? "全画面" : "重ねる"}</span>
                    <span>
                      命令 {beat.script.length}・文章 {texts.length}
                    </span>
                    {todos > 0 ? (
                      <span className="st-badge" data-kind="todo">
                        未記入 {todos}
                      </span>
                    ) : null}
                    {issues.length > 0 ? (
                      <span className="st-badge" data-kind="todo">
                        書き間違い {issues.length}
                      </span>
                    ) : null}
                  </p>
                  <p className="st-help">{status}</p>
                  <Link className="st-choice" href={`/story/scene/${beat.id}`}>
                    再生
                  </Link>
                </li>
              );
            })}
          </ul>
          {!state.flags.includes("started") ? (
            <button
              type="button"
              className="st-secondary"
              disabled={!ready}
              onClick={() => setFlag("started")}
            >
              ゲームを始めたことにする（started）
            </button>
          ) : null}
        </main>

        <aside className="st-panel">
          <h2 className="st-panel-title">人物</h2>
          <dl className="st-people">
            {Object.values(characters).map((person) => (
              <div key={person.id} className="st-person">
                <dt style={{ color: person.color }}>
                  {person.name}（{person.age}歳・一人称「{person.firstPerson}」）
                </dt>
                <dd>{person.note}</dd>
              </div>
            ))}
          </dl>
          <h2 className="st-panel-title">呼び名</h2>
          <ul className="st-waiting">
            {nicknames.map((nickname) => (
              <li key={nickname.text}>
                「{nickname.text}」：{nickname.usedBy.map((id) => characters[id].name).join("、")}
              </li>
            ))}
          </ul>
          <h2 className="st-panel-title">統一の部品（名前で指定）</h2>
          <dl className="st-catalog">
            <dt>文章の枠</dt>
            <dd>
              {Object.entries(FRAMES)
                .map(([key, value]) => `${key}（${value}）`)
                .join("、")}
            </dd>
            <dt>背景</dt>
            <dd>
              {Object.entries(BACKGROUNDS)
                .map(([key, value]) => `${key}（${value.label}）`)
                .join("、")}
            </dd>
            <dt>小物</dt>
            <dd>
              {Object.entries(PROPS)
                .map(([key, value]) => `${key}（${value.label}）`)
                .join("、")}
            </dd>
            <dt>表情</dt>
            <dd>
              {Object.entries(EXPRESSIONS)
                .map(([key, value]) => `${key}（${value}）`)
                .join("、")}
            </dd>
            <dt>位置</dt>
            <dd>{Object.keys(POSITIONS).join("、")}（または x・y の％）</dd>
            <dt>動きの型</dt>
            <dd>{Object.keys(MOTIONS).join("、")}（またはキーフレームを自由に）</dd>
            <dt>背景の切り替え</dt>
            <dd>{TRANSITIONS.join("、")}</dd>
            <dt>カスタム演出</dt>
            <dd>
              {Object.entries(CUSTOM_CUES)
                .map(([key, value]) => `${key}（${value}）`)
                .join("、")}
            </dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
