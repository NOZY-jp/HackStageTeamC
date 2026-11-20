"use client";

import Link from "next/link";
import { useState } from "react";
import { useStory } from "@/components/common/story/story-provider";
import {
  type Beat,
  beats,
  CHAPTER_TITLES,
  type Channel,
  characters,
  currentChapter,
  flagLabel,
  type Line,
  missingFor,
  nicknames,
  steps,
  transcript,
} from "@/lib/story";

function channelLabel(channel: Channel): string {
  return channel.kind === "discord-dm"
    ? `Discord：${characters[channel.with].name}との DM`
    : "リョウの独り言・地の文";
}

function LineView({ line }: { line: Line }) {
  return (
    <li className="st-line" data-from={line.from} data-todo={line.todo ? "true" : undefined}>
      {line.from === "system" ? null : (
        <span className="st-speaker">{characters[line.from].name}</span>
      )}
      <span className="st-text">{line.text}</span>
    </li>
  );
}

function BeatHeader({ beat }: { beat: Beat }) {
  return (
    <h3 className="st-beat-title">
      {channelLabel(beat.channel)}
      <span className="st-beat-id">{beat.id}</span>
      {beat.source ? <span className="st-beat-id">出典: {beat.source}</span> : null}
    </h3>
  );
}

/** 次の場面を1行ずつ流し、選択肢があれば選ばせる。無ければ「次へ」で終える */
function BeatPlayer({ beat }: { beat: Beat }) {
  const { completeBeat } = useStory();
  // 場面が変わると key で作り直されるので、表示した行数はここで 0 から始まる
  const [shown, setShown] = useState(0);
  const finished = shown >= beat.lines.length;
  const hasChoices = (beat.choices?.length ?? 0) > 0;

  const showNext = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(beat.lines.length);
      return;
    }
    setShown((count) => count + 1);
  };

  return (
    <section className="st-beat" data-playing="true">
      <BeatHeader beat={beat} />
      <ol className="st-lines" aria-live="polite">
        {beat.lines.slice(0, shown).map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 台本の行は固定で並び替えない
          <LineView key={index} line={line} />
        ))}
      </ol>
      <div className="st-choices">
        {!finished ? (
          <>
            <button type="button" className="st-choice" onClick={showNext}>
              次の行
            </button>
            <button
              type="button"
              className="st-secondary"
              onClick={() => setShown(beat.lines.length)}
            >
              場面を最後まで表示
            </button>
          </>
        ) : hasChoices ? (
          beat.choices?.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="st-choice"
              onClick={() => completeBeat(beat, choice.id)}
            >
              {choice.label}
            </button>
          ))
        ) : (
          <button type="button" className="st-choice" onClick={() => completeBeat(beat)}>
            次の場面へ
          </button>
        )}
      </div>
    </section>
  );
}

export function StoryConsole() {
  const { state, upcoming, setFlag, reset, ready } = useStory();
  const history = transcript(state);
  const chapter = currentChapter(state);
  const waiting = beats.filter(
    (beat) => !state.completed.includes(beat.id) && beat.id !== upcoming?.id,
  );
  const todoCount = beats.flatMap((beat) => beat.lines).filter((line) => line.todo).length;

  return (
    <div className="st-shell">
      <header className="st-header">
        <h1 className="st-title">進行チェック（開発用）</h1>
        <p className="st-chapter">
          いまの章：第{chapter}章 {CHAPTER_TITLES[chapter] ?? ""}
        </p>
        <p className="st-help">
          ゲームの画面ではありません。台本の流れと、謎解きの段階の手がかりがそろっているかを確かめる画面です。
        </p>
        <button type="button" className="st-reset" onClick={reset}>
          最初からやり直す
        </button>
      </header>

      <div className="st-layout">
        <section className="st-panel" aria-labelledby="st-steps">
          <h2 id="st-steps" className="st-panel-title">
            謎解きの段階（正本 #76）
          </h2>
          <p className="st-help">
            「着いた」を押すと、その段階に着いたことにします（本番では各画面を開いたときに立つ）。
          </p>
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
          <h2 className="st-panel-title">台本（第一章〜）</h2>
          {todoCount > 0 ? (
            <p className="st-help">文面が未定の行が {todoCount} 行あります（黄色の行）。</p>
          ) : null}
          {!state.flags.includes("started") ? (
            <button
              type="button"
              className="st-choice"
              disabled={!ready}
              onClick={() => setFlag("started")}
            >
              ゲームを始める
            </button>
          ) : null}
          {history.map(({ beat, lines }) => (
            <section key={beat.id} className="st-beat">
              <BeatHeader beat={beat} />
              <ol className="st-lines">
                {lines.map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 履歴は組み立て直すたびに同じ順
                  <LineView key={index} line={line} />
                ))}
              </ol>
            </section>
          ))}
          {upcoming ? <BeatPlayer key={upcoming.id} beat={upcoming} /> : null}
          {waiting.length > 0 ? (
            <>
              <h3 className="st-panel-title">まだ始まらない場面</h3>
              <ul className="st-waiting">
                {waiting.map((beat) => {
                  const missing = missingFor(state, beat);
                  return (
                    <li key={beat.id}>
                      <code>{beat.id}</code>：
                      {[
                        ...missing.flags.map((flag) => flagLabel(flag)),
                        ...missing.beats.map((id) => `場面 ${id} のあと`),
                      ].join(" / ") || "前の場面の再生中"}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </main>

        <aside className="st-panel">
          <h2 className="st-panel-title">人物（作中の名前）</h2>
          <dl className="st-people">
            {Object.values(characters).map((person) => (
              <div key={person.id} className="st-person">
                <dt>
                  {person.name}（{person.age}歳・一人称「{person.firstPerson}」）
                </dt>
                <dd>{person.note}</dd>
                <dd className="st-accounts">
                  {Object.entries(person.accounts)
                    .map(([platform, value]) => `${platform}: ${value}`)
                    .join(" / ")}
                </dd>
              </div>
            ))}
          </dl>
          <h2 className="st-panel-title">呼び名</h2>
          <ul className="st-waiting">
            {nicknames.map((nickname) => (
              <li key={nickname.text}>
                「{nickname.text}」：{nickname.usedBy.map((id) => characters[id].name).join("、")}
                {nickname.note ? `（${nickname.note}）` : ""}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
