import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContestResultPage from "@/app/(blog-like)/pochiblo/[blogId]/contest/soukyuu-photo-award-2020/page";
import EntryPage from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import TalkupPage from "@/app/(facebook-like)/talkup/page";
import { canConfirmTalkup, shouldRecordMatch } from "@/app/(facebook-like)/talkup/reveal";
import { StoryConsole } from "@/app/(story)/_components/story-console";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { PHOTO_CONTEST_BLOG_ID } from "@/lib/seo/contest";
import { availableBeats, type FlagId, STORAGE_KEY } from "@/lib/story";
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

const renderContest = async (onState: (flags: FlagId[]) => void) => {
  const page = await ContestResultPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID }),
    searchParams: Promise.resolve({}),
  });
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

const seed = (flags: string[]) =>
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ flags, completed: ["ch5-kai-contact"], choices: {} }),
  );

describe("段階7・8・10・結末（実ページ経由）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    nav.query = new URLSearchParams();
  });

  it("コンテスト結果ページで受賞者を確認すると段階7が立ち、検索への導線が出る", async () => {
    const seen: FlagId[][] = [];
    await renderContest((flags) => seen.push(flags));

    expect(screen.queryByRole("button", { name: "この名前で検索する" })).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "受賞者を確認する" }));

    await waitFor(() => expect(seen.at(-1)).toContain("s07-contest-entry"));
    expect(await screen.findByRole("button", { name: "この名前で検索する" })).toBeTruthy();
  });

  it("talkup で本名検索して本人が出ると段階8が立ち、カイの連絡後に確認できる", async () => {
    seed(["started", "s07-contest-entry"]);
    nav.query = new URLSearchParams({ q: BFF_QUERY });
    const seen: FlagId[][] = [];
    await renderTalkup((flags) => seen.push(flags));

    await waitFor(() => expect(seen.at(-1)).toContain("s08-real-name"));
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();

    // 段階9（カイの連絡）まで進める
    const user = userEvent.setup();
    for (let i = 0; i < 7; i += 1) {
      await user.click(screen.getAllByRole("button", { name: "着いた" })[0]);
    }
    const button = await screen.findByRole("button", { name: "この人物で間違いない" });
    await user.click(button);
    await waitFor(() => expect(seen.at(-1)).toContain("s10-talkup-match"));
  });

  it("受賞者を確認していなければ、検索で本人が出ても段階8は立たない", async () => {
    seed(["started"]);
    nav.query = new URLSearchParams({ q: BFF_QUERY });
    const seen: FlagId[][] = [];
    await renderTalkup((flags) => seen.push(flags));
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("s08-real-name");
    expect(shouldRecordMatch([], ["u40"])).toBe(false);
  });

  it("talkup は、検索結果が本人（u40）でなければ確認ボタンを出さない", async () => {
    seed(["started", "s07-contest-entry", "s08-real-name", "s09-kai-contact"]);
    nav.query = new URLSearchParams({ q: "member01" });
    await renderTalkup(() => {});
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();
    expect(
      canConfirmTalkup(["s07-contest-entry", "s08-real-name", "s09-kai-contact"], ["u1"]),
    ).toBe(false);
  });

  it("段階8を飛ばすと結末は解禁されない", () => {
    const skipped = {
      flags: ["s07-contest-entry", "s09-kai-contact", "s10-talkup-match"] as FlagId[],
      completed: ["ch5-kai-contact"],
      choices: {},
    };
    expect(
      availableBeats(skipped).some((beat) =>
        beat.choices?.some((choice) => choice.label === "住所を特定しました"),
      ),
    ).toBe(false);
  });

  it("開発用コンソール無し（本番相当）でも、受賞記事→結果→確認→検索の順で進める", async () => {
    const seen: FlagId[][] = [];
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
        {entry}
        {result}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    // コンソールは描画していない（本番と同じ）
    expect(screen.queryByRole("button", { name: "着いた" })).toBeNull();
    // 受賞記事から結果ページへは移動だけ（段階7はまだ立たない）
    await userEvent.setup().click(screen.getByRole("button", { name: "結果ページを見る" }));
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("s07-contest-entry");

    await userEvent.setup().click(screen.getByRole("button", { name: "受賞者を確認する" }));
    await waitFor(() => expect(seen.at(-1)).toContain("s07-contest-entry"));
    expect(await screen.findByRole("button", { name: "この名前で検索する" })).toBeTruthy();

    // その名前で検索すると段階8が立ち、カイの連絡（段階9）が届く状態になる
    nav.query = new URLSearchParams({ q: BFF_QUERY });
    const talkupSeen: FlagId[][] = [];
    render(
      <StoryProvider>
        <FacebookProvider>
          <TalkupPage />
        </FacebookProvider>
        <Probe onState={(flags) => talkupSeen.push(flags)} />
      </StoryProvider>,
    );
    await waitFor(() => expect(talkupSeen.at(-1)).toContain("s08-real-name"));
    const afterSearch = { flags: talkupSeen.at(-1) ?? [], completed: [], choices: {} };
    expect(availableBeats(afterSearch).some((beat) => beat.place === "discord:dm-kai")).toBe(true);
  });
});
