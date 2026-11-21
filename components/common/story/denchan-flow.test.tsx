import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContestResultPage from "@/app/(blog-like)/pochiblo/[blogId]/contest/soukyuu-photo-award-2020/page";
import EntryPage from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import TalkupPage from "@/app/(facebook-like)/talkup/page";
import { StoryConsole } from "@/app/(story)/_components/story-console";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { PHOTO_CONTEST_BLOG_ID } from "@/lib/seo/contest";
import { availableBeats, beats, completedChats, transcript } from "@/lib/story";
import { StoryProvider, useStory } from "./story-provider";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BFF_QUERY = `${word(0x670d, 0x90e8)} ${word(0x7531, 0x6bd4)}`;
const nav = { query: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.query,
  usePathname: () => "/talkup",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

/** 場面を1つ進める（選択肢は指定、無指定なら最初） */
function Driver({ steps }: { steps: readonly (readonly [string, string?])[] }) {
  const { completeBeat } = useStory();
  return (
    <div>
      {steps.map(([id, choice]) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            const beat = beats.find((candidate) => candidate.id === id);
            if (beat) completeBeat(beat, [choice ?? beat.choices?.[0]?.id ?? ""].filter(Boolean));
          }}
        >
          進める {id}
        </button>
      ))}
    </div>
  );
}

/** 進行状態を読み出して画面に出す（フラグ・履歴・次の場面） */
function Inspector() {
  const { state } = useStory();
  const chats = completedChats(state)
    .map((chat) => chat.text)
    .join("\n");
  const lines = transcript(state, beats)
    .flatMap(({ lines }) => lines.map((line) => line.text))
    .join("\n");
  return (
    <>
      <p data-testid="flags">{state.flags.join(",")}</p>
      <p data-testid="available">
        {availableBeats(state)
          .map((beat) => beat.id)
          .join(",")}
      </p>
      <pre data-testid="chats">{chats}</pre>
      <pre data-testid="lines">{lines}</pre>
    </>
  );
}

const BEATS = [
  ["ch1-prologue", "leave-call"],
  ["ch2-disappearance"],
  ["ch3-ask-kai"],
  ["ch3-kai-twixer-lead"],
  ["ch3-blog-found"],
  ["ch4-leaf"],
  ["ch4-old-account"],
  ["ch4-old-blog"],
  ["ch4-real-name"],
  ["ch5-kai-contact"],
] as const;

async function renderFlow() {
  window.localStorage.clear();
  nav.query = new URLSearchParams();
  const entry = await EntryPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID, entryId: "e20181117" }),
    searchParams: Promise.resolve({}),
  });
  const result = await ContestResultPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID }),
    searchParams: Promise.resolve({}),
  });
  render(
    <StoryProvider>
      <StoryConsole />
      {entry}
      {result}
      <FacebookProvider>
        <TalkupPage />
      </FacebookProvider>
      <Driver steps={BEATS} />
      <Inspector />
    </StoryProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "ゲームを始めたことにする（started）" }));
  // 発見の段階は進行チェックの「着いた」で進める（UI操作）
  for (let i = 0; i < 6; i += 1) {
    await user.click(screen.getAllByRole("button", { name: "着いた" })[0]);
  }
  await user.click(screen.getByRole("button", { name: "コンテスト名を控える" }));
  await waitFor(() => expect(screen.getByTestId("flags").textContent).toContain("s08-real-name"));
  for (const [id] of BEATS) {
    await user.click(screen.getByRole("button", { name: `進める ${id}` }));
  }
  await waitFor(() => expect(screen.getByTestId("flags").textContent).toContain("kaiToldDenchan"));
  // s10 は talkup で本人を確認して立てる
  nav.query = new URLSearchParams({ q: BFF_QUERY });
  render(
    <StoryProvider>
      <FacebookProvider>
        <TalkupPage />
      </FacebookProvider>
      <Inspector />
    </StoryProvider>,
  );
  const confirm = await screen.findByRole("button", { name: "この人物で間違いない" });
  await user.click(confirm);
  await waitFor(() =>
    expect(screen.getAllByTestId("flags").at(-1)?.textContent).toContain("s10-talkup-match"),
  );
  return user;
}

describe("でんちゃん誤認の分岐（#120・実プレイ経由）", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("助言経由で「でんちゃん」と呼ぶと誤認結末が選べる", async () => {
    const user = await renderFlow();
    render(
      <StoryProvider>
        <Driver
          steps={[
            ["ch5-talkup", "visit-house"],
            ["ch6-call-name", "denden"],
          ]}
        />
        <Inspector />
      </StoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: "進める ch5-talkup" }));
    await user.click(screen.getByRole("button", { name: "進める ch6-call-name" }));
    const flags = await waitFor(() => screen.getAllByTestId("flags").at(-1)?.textContent ?? "");
    expect(flags).toContain("usedDenchan");
    const available = screen.getAllByTestId("available").at(-1)?.textContent ?? "";
    expect(available).toContain("ch6-bad-end");
    const lines = screen.getAllByTestId("lines").at(-1)?.textContent ?? "";
    expect(lines).toContain("でんちゃん！");
    expect(lines).not.toContain("今は、会えない");
  }, 30_000);

  it("表示名で呼べば誤認結末には進まない", async () => {
    const user = await renderFlow();
    render(
      <StoryProvider>
        <Driver
          steps={[
            ["ch5-talkup", "visit-house"],
            ["ch6-call-name", "name"],
          ]}
        />
        <Inspector />
      </StoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: "進める ch5-talkup" }));
    await user.click(screen.getByRole("button", { name: "進める ch6-call-name" }));
    const flags = await waitFor(() => screen.getAllByTestId("flags").at(-1)?.textContent ?? "");
    expect(flags).toContain("calledByName");
    expect(flags).not.toContain("usedDenchan");
    const available = screen.getAllByTestId("available").at(-1)?.textContent ?? "";
    expect(available).not.toContain("ch6-bad-end");
    expect(available).toContain("ch6-wait-end");
    const lines = screen.getAllByTestId("lines").at(-1)?.textContent ?? "";
    expect(lines).toContain("琥珀さん、いますか");
  }, 30_000);
});
