import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContestResultPage from "@/app/(blog-like)/pochiblo/[blogId]/contest/soukyuu-photo-award-2020/page";
import EntryPage from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import TalkupPage from "@/app/(facebook-like)/talkup/page";
import { StoryConsole } from "@/app/(story)/_components/story-console";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { PHOTO_CONTEST_BLOG_ID } from "@/lib/seo/contest";
import { availableBeats, type FlagId } from "@/lib/story";
import { StoryProvider, useStory } from "./story-provider";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BFF_QUERY = `${word(0x670d, 0x90e8)} ${word(0x7531, 0x6bd4)}`;

const nav = { query: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.query,
  usePathname: () => "/talkup",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

/** 進行状態を読むだけの表示（テストからフラグを直接入れない） */
function Probe({ onState }: { onState: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onState(state.flags);
  return null;
}

/** 進行コンソールの「着いた」を、指定した段階まで順に押す（実UIの操作） */
async function reachSteps(count: number) {
  const user = userEvent.setup();
  for (let i = 0; i < count; i += 1) {
    const buttons = screen.getAllByRole("button", { name: "着いた" });
    await user.click(buttons[0]);
  }
}

const renderContest = async (onState: (flags: FlagId[]) => void) => {
  const params = Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID });
  const searchParams = Promise.resolve({});
  const page = await ContestResultPage({ params, searchParams });
  return render(
    <StoryProvider>
      <StoryConsole />
      {page}
      <Probe onState={onState} />
    </StoryProvider>,
  );
};

const renderTalkup = (onState: (flags: FlagId[]) => void) =>
  render(
    <StoryProvider>
      <StoryConsole />
      <FacebookProvider>
        <TalkupPage />
      </FacebookProvider>
      <Probe onState={onState} />
    </StoryProvider>,
  );

describe("段階8・10・結末の導線（実ページ経由・フラグ注入なし）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    nav.query = new URLSearchParams();
  });

  it("コンテスト結果ページは、順序7の後だけ本名の確認ボタンを出す", async () => {
    const seen: FlagId[][] = [];
    await renderContest((flags) => seen.push(flags));

    // 順序7より前は出ない
    expect(screen.queryByRole("button", { name: "この受賞者で間違いない" })).toBeNull();

    await reachSteps(7);
    const button = await screen.findByRole("button", { name: "この受賞者で間違いない" });
    await userEvent.setup().click(button);

    expect(seen.at(-1)).toContain("s08-real-name");
  });

  it("talkup は、カイの連絡の後かつ本人（u40）が結果にある時だけ確認できる", async () => {
    nav.query = new URLSearchParams({ q: BFF_QUERY });
    const seen: FlagId[][] = [];
    await renderTalkup((flags) => seen.push(flags));

    // 順序9の前は出ない
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();

    // 進行コンソールで段階9まで進める（実UI）
    const user = userEvent.setup();
    const reached = screen.getAllByRole("button", { name: "着いた" });
    for (let i = 0; i < 9; i += 1) {
      await user.click(screen.getAllByRole("button", { name: "着いた" })[0]);
    }
    void reached;

    const button = await screen.findByRole("button", { name: "この人物で間違いない" });
    await user.click(button);
    expect(seen.at(-1)).toContain("s10-talkup-match");
  });

  it("talkup は、検索結果が本人（u40）でなければ確認ボタンを出さない", async () => {
    nav.query = new URLSearchParams({ q: "member01" });
    await renderTalkup(() => {});
    const user = userEvent.setup();
    for (let i = 0; i < 9; i += 1) {
      await user.click(screen.getAllByRole("button", { name: "着いた" })[0]);
    }
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();
  });

  it("段階8を飛ばすと結末は解禁されない（進行コンソール経由）", async () => {
    const seen: FlagId[][] = [];
    await renderTalkup((flags) => seen.push(flags));
    const user = userEvent.setup();
    // 9・10だけ進める（8は押さない）
    const clickStep = async (index: number) => {
      await user.click(screen.getAllByRole("button", { name: "着いた" })[index]);
    };
    await clickStep(8); // s09
    await clickStep(8); // s10（s09 が消えたぶん繰り上がる）
    expect(seen.at(-1)).not.toContain("s08-real-name");

    const skipped = { flags: seen.at(-1) ?? [], completed: ["ch5-kai-contact"], choices: {} };
    expect(
      availableBeats(skipped).some((beat) =>
        beat.choices?.some((choice) => choice.label === "住所を特定しました"),
      ),
    ).toBe(false);
  });

  it("talkup は、検索が0件なら確認ボタンを出さない", async () => {
    nav.query = new URLSearchParams({ q: "zzzznotfound" });
    await renderTalkup(() => {});
    const user = userEvent.setup();
    for (let i = 0; i < 9; i += 1) {
      await user.click(screen.getAllByRole("button", { name: "着いた" })[0]);
    }
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();
  });

  it("開発用コンソール無し（本番相当）でも、受賞記事の操作から順序7→8へ進める", async () => {
    const seen: FlagId[][] = [];
    const entryParams = Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID, entryId: "e20181117" });
    const entry = await EntryPage({ params: entryParams, searchParams: Promise.resolve({}) });
    const resultParams = Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID });
    const result = await ContestResultPage({
      params: resultParams,
      searchParams: Promise.resolve({}),
    });
    render(
      <StoryProvider>
        {entry}
        {result}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    // 進行コンソールは描画していない（本番と同じ）
    expect(screen.queryByRole("button", { name: "着いた" })).toBeNull();
    expect(screen.queryByRole("button", { name: "この受賞者で間違いない" })).toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "結果ページを見る" }));
    expect(seen.at(-1)).toContain("s07-contest-entry");

    const reveal = await screen.findByRole("button", { name: "この受賞者で間違いない" });
    await userEvent.setup().click(reveal);
    expect(seen.at(-1)).toContain("s08-real-name");
  });
});
