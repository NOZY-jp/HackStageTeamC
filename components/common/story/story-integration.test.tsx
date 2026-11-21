import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContestResultPage from "@/app/(blog-like)/pochiblo/[blogId]/contest/soukyuu-photo-award-2020/page";
import EntryPage from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import TalkupPage from "@/app/(facebook-like)/talkup/page";
import { canConfirmTalkup } from "@/app/(facebook-like)/talkup/reveal";
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

function Probe({ onState }: { onState: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onState(state.flags);
  return null;
}

const entryPage = () =>
  EntryPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID, entryId: "e20181117" }),
    searchParams: Promise.resolve({}),
  });
const resultPage = () =>
  ContestResultPage({
    params: Promise.resolve({ blogId: PHOTO_CONTEST_BLOG_ID }),
    searchParams: Promise.resolve({}),
  });

const seed = (flags: string[]) =>
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ flags, completed: ["ch5-kai-contact"], choices: {} }),
  );

describe("段階7・8・10・結末（実ページ経由・本名は結果ページでだけ）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    nav.query = new URLSearchParams();
  });

  it("受賞記事でコンテスト名を控えると段階7が立ち、結果ページへのリンクは無い", async () => {
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        {await entryPage()}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    // 結果ページへの直リンクは置かない（順序8は検索で発見する）
    expect(screen.queryByRole("button", { name: "結果ページを見る" })).toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "コンテスト名を控える" }));
    await waitFor(() => expect(seen.at(-1)).toContain("s07-contest-entry"));
  });

  it("段階7の後に結果ページを見ると本名が出て段階8が立つ", async () => {
    seed(["started", "s07-contest-entry"]);
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        {await resultPage()}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    expect(await screen.findByText("服部 由比")).toBeTruthy();
    await waitFor(() => expect(seen.at(-1)).toContain("s08-real-name"));
  });

  it("段階7の前に結果ページを開いても、本名を出さず段階8も立てない", async () => {
    seed(["started"]);
    const seen: FlagId[][] = [];
    const { container } = render(
      <StoryProvider>
        {await resultPage()}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(container.innerHTML).not.toContain("服部 由比");
    expect(seen.at(-1)).not.toContain("s08-real-name");
  });

  it("talkup の確認は s07・s08・s09 と本人（u40）が揃ったときだけ", () => {
    expect(canConfirmTalkup([], ["u40"])).toBe(false);
    expect(canConfirmTalkup(["s07-contest-entry", "s08-real-name"], ["u40"])).toBe(false);
    expect(canConfirmTalkup(["s07-contest-entry", "s08-real-name", "s09-kai-contact"], [])).toBe(
      false,
    );
    expect(
      canConfirmTalkup(["s07-contest-entry", "s08-real-name", "s09-kai-contact"], ["u1"]),
    ).toBe(false);
    expect(
      canConfirmTalkup(["s07-contest-entry", "s08-real-name", "s09-kai-contact"], ["u40"]),
    ).toBe(true);
  });

  it("通常UI（コンソール無し）で 受賞記事→結果ページ の順に進み、結末は s08 無しでは出ない", async () => {
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        {await entryPage()}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    expect(screen.queryByRole("button", { name: "着いた" })).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "コンテスト名を控える" }));
    await waitFor(() => expect(seen.at(-1)).toContain("s07-contest-entry"));

    // 検索で結果ページに着いた想定で、結果ページを開く（同じ進行状態）
    render(
      <StoryProvider>
        {await resultPage()}
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    await waitFor(() => expect(seen.at(-1)).toContain("s08-real-name"));

    const skipped = {
      flags: ["s07-contest-entry", "s09-kai-contact", "s10-talkup-match"] as FlagId[],
      completed: ["ch5-kai-contact"],
      choices: {},
    };
    expect(
      availableBeats(skipped).some((beat) =>
        beat.choices?.some((choice) => choice.label === "現地へ向かう"),
      ),
    ).toBe(false);
  });
});

describe("talkup の確認ボタン", () => {
  it("本人が出ていても、段階9の前は確認ボタンを出さない", () => {
    render(
      <StoryProvider>
        <FacebookProvider>
          <TalkupPage />
        </FacebookProvider>
      </StoryProvider>,
    );
    nav.query = new URLSearchParams({ q: BFF_QUERY });
    expect(screen.queryByRole("button", { name: "この人物で間違いない" })).toBeNull();
  });
});
