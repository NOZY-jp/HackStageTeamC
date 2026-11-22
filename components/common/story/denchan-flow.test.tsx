import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntryPage from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import ContestResultPage from "@/app/(contest-like)/soukyuu-photo/2020/result/page";
import TalkupPage from "@/app/(facebook-like)/talkup/page";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { PHOTO_CONTEST_BLOG_ID } from "@/lib/seo/contest";
import { availableBeats, type PlaybackSettings } from "@/lib/story";
import { ScenePlayer } from "./stage/scene-player";
import { StoryProvider, useStory } from "./story-provider";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BFF_QUERY = `${word(0x670d, 0x90e8)} ${word(0x7531, 0x6bd4)}`;
const nav = { query: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.query,
  usePathname: () => "/talkup",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

/** いま始まっている場面を、実際の場面UIで流す（選択肢は画面のボタンを押す） */
function Stage() {
  const { state, completeBeat } = useStory();
  const beat = availableBeats(state).find((candidate) => !state.completed.includes(candidate.id));
  // スキップで本文を自動再生し、選択肢では止まる（本文の送りはテストの対象外）
  const [settings, setSettings] = useState<PlaybackSettings>({
    mode: "skip",
    speed: "instant",
  });
  if (!beat) return null;
  return (
    <ScenePlayer
      key={beat.id}
      beat={beat}
      settings={settings}
      onSettingsChange={setSettings}
      onComplete={(done, chosen) => completeBeat(done, chosen)}
      onShownLinesChange={(lines) => {
        for (const line of lines) {
          if (!shownLines.includes(line.text)) shownLines.push(line.text);
        }
      }}
      flags={state.flags}
      onFlag={() => {}}
      onMinimize={() => {}}
      onOpenLog={() => {}}
    />
  );
}

/** 進行状態を読み出して画面に出す */
function Inspector() {
  const { state, ready } = useStory();
  if (!ready) return null;
  return (
    <>
      <p data-testid="flags">{state.flags.join(",")}</p>
      <p data-testid="available">
        {availableBeats(state)
          .map((beat) => beat.id)
          .join(",")}
      </p>
      <p data-testid="completed">{state.completed.join(",")}</p>
    </>
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 実際に文章の窓に出た行（ScenePlayer が画面へ出したもの） */
let shownLines: string[] = [];

/** 本文を押して最後まで進め、選択肢が出たらラベルで選ぶ */
async function playScene(
  user: ReturnType<typeof userEvent.setup>,
  choose?: string,
  timeoutMs = 30000,
) {
  try {
    return await chooseFrom(user, choose, timeoutMs);
  } catch (error) {
    throw new Error(
      `選択肢が出ません: 本文=${document.querySelector(".sw-text")?.textContent ?? "なし"} 場面=${screen.getAllByTestId("available").at(-1)?.textContent} 完了=${screen.getAllByTestId("completed").at(-1)?.textContent} (${String(error)})`,
    );
  }
}

async function chooseFrom(
  user: ReturnType<typeof userEvent.setup>,
  choose: string | undefined,
  timeoutMs: number,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const fieldset = screen.queryByRole("group", { name: "選択肢" });
    const buttons = fieldset ? [...fieldset.querySelectorAll("button")] : [];
    if (buttons.length > 0) {
      const target = choose ? screen.getByRole("button", { name: choose }) : buttons[0];
      const before = screen.getAllByTestId("completed").at(-1)?.textContent ?? "";
      await user.click(target);
      // 選択のあと、場面を閉じる操作（本文を押す）で次の場面へ進む
      for (let i = 0; i < 40; i += 1) {
        if ((screen.getAllByTestId("completed").at(-1)?.textContent ?? "") !== before) return;
        const rest = document.querySelector(".sw-body");
        if (rest) await user.click(rest);
        await sleep(100);
      }
      return;
    }
    const body = document.querySelector(".sw-body");
    if (body) await user.click(body);
    await sleep(60);
  }
  throw new Error("選択肢待ち");
}

async function playToDoor() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  shownLines = [];
  nav.query = new URLSearchParams();
  const entry = await EntryPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID, entryId: "e20181117" }),
    searchParams: Promise.resolve({}),
  });
  const result = ContestResultPage();
  // s08 はコンテストの結果ページで本名に触れて立てる（実ページ）
  nav.query = new URLSearchParams({ q: BFF_QUERY });
  render(
    <StoryProvider>
      {entry}
      {result}
      <FacebookProvider>
        <TalkupPage />
      </FacebookProvider>
      <Stage />
      <Inspector />
    </StoryProvider>,
  );
  const user = userEvent.setup();
  // 受賞記事を開くと s07、そのあと結果ページで受賞者名が出て s08 が立つ（#222）
  await waitFor(() =>
    expect(screen.getAllByTestId("flags").at(-1)?.textContent).toContain("s08-real-name"),
  );

  // カイとの連絡は場面UIで流す
  await waitFor(
    () =>
      expect(screen.getAllByTestId("completed").at(-1)?.textContent).toContain("ch5-kai-contact"),
    { timeout: 30_000 },
  );
  await waitFor(() =>
    expect(screen.getAllByTestId("flags").at(-1)?.textContent).toContain("kaiToldDenchan"),
  );

  // 本人確認は talkup の実ページで行い、s10 を立てる
  const confirm = await screen.findByRole("button", { name: "この人物で間違いない" });
  await user.click(confirm);
  await waitFor(() =>
    expect(screen.getAllByTestId("flags").at(-1)?.textContent).toContain("s10-talkup-match"),
  );
  return user;
}

/** 場面を最後まで進める（本文は ScenePlayer が出した行をそのまま集める） */
async function finishScene(user: ReturnType<typeof userEvent.setup>, id: string) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (screen.getAllByTestId("completed").at(-1)?.textContent?.includes(id)) break;
    const body = document.querySelector(".sw-body");
    if (body) await user.click(body);
    await sleep(80);
  }
  return shownLines.join(String.fromCharCode(10));
}

describe("でんちゃん誤認の分岐（#120・実プレイ経由）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    shownLines = [];
  });

  it("「でんちゃん」を選ぶと、誤認の結末が画面に出る", async () => {
    const user = await playToDoor();
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch5-talkup"),
    );
    // 画面の選択肢ボタンで「現地へ向かう」を選ぶ
    await playScene(user, "現地へ向かう");
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch6-call-name"),
    );
    // 画面の選択肢ボタンで「でんちゃん」を選ぶ
    await playScene(user, "「でんちゃん」と呼ぶ");
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch6-bad-end"),
    );
    await playScene(user, "違和感を調べ直す");
    const shown = await finishScene(user, "ch6-bad-end");
    expect(shown).toContain("その呼び方");
    expect(shown).toContain("BAD END");
  }, 180_000);

  it("表示名で呼べば、誤認の結末は出ない", async () => {
    const user = await playToDoor();
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch5-talkup"),
    );
    await playScene(user, "現地へ向かう");
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch6-call-name"),
    );
    await playScene(user, "表示名で呼ぶ");
    await waitFor(() =>
      expect(screen.getAllByTestId("available").at(-1)?.textContent).toContain("ch6-wait-end"),
    );
    expect(screen.getAllByTestId("available").at(-1)?.textContent).not.toContain("ch6-bad-end");
    const shown = await finishScene(user, "ch6-wait-end");
    expect(shown).toContain("今は、会えない");
    expect(shown).not.toContain("その呼び方");
    expect(shown).not.toContain("BAD END");
  }, 180_000);

  it("住所を特定していなければ、呼び名の選択は出ない", async () => {
    await playToDoor();
    expect(screen.getAllByTestId("available").at(-1)?.textContent).not.toContain("ch6-call-name");
    expect(screen.queryByRole("button", { name: "「でんちゃん」と呼ぶ" })).not.toBeInTheDocument();
  }, 180_000);
});
