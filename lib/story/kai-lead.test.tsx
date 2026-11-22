import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TwitterPostPage from "@/app/twitter/post/[postId]/page";
import TwitterProfilePage from "@/app/twitter/profile/[handle]/page";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { resolveLinkEmbeds } from "@/lib/link-embed";
import { getPost } from "@/lib/twitter-like";
import snapshot from "@/lib/twitter-like/post-101-102.snapshot.json";
import { availableBeats, completeBeat, initialState, linesOf } from "./engine";
import { beats } from "./scenario";
import { steps } from "./steps";
import { loadState, saveState } from "./storage";
import type { Beat } from "./types";

/**
 * #213: カイの第三章の誘導を弱める。投稿の直リンクは送らず、アカウントだけ。
 * アカウント → post-101 → post-102 → s02 の導線は成立したまま。
 */

/** post-101 / post-102 の完全な写し（全フィールド）。 */
const SNAPSHOT = snapshot;

const lead = beats.find((beat) => beat.id === "ch3-kai-twixer-lead");
const advice = beats.find((beat) => beat.id === "ch3-ask-kai");
const texts = (beat: Beat | undefined) => (beat ? linesOf(beat).map((line) => line.text) : []);
/** チャットとして送られる本文 */
const chats = (beat: Beat | undefined) =>
  (beat?.script ?? []).flatMap((cue) => (cue.type === "chat" ? [cue.text] : []));

/** 物語の状態が読み込まれた時点のフラグ（画面に返信が出たかを見るための準備待ち） */
function FlagProbe({ onFlags }: { onFlags: (flags: string[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onFlags(state.flags);
  return null;
}

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

describe("カイの第三章の誘導（#213）", () => {
  it("アカウントのURLだけを送り、投稿の直リンクは送らない", () => {
    const lines = chats(lead);
    expect(lines).toContain("https://twixer.com/mai2mai2");
    expect(lines.some((line) => line.includes("status/post-101"))).toBe(false);
  });

  it("次の操作を指示する文面を残していない", () => {
    const all = [...texts(lead), ...texts(advice)].join("\n");
    expect(all).not.toContain("他のプラットフォーム");
    expect(all).not.toContain("検索かけたら");
    expect(all).not.toContain("Discord だけじゃなくて他のとこ");
  });

  it("過去の発言の引用は1件まで", () => {
    const quotes = texts(advice).filter((line) => line.includes("MaiMai（過去のチャット）"));
    expect(quotes.length).toBeLessThanOrEqual(1);
  });

  it("段階2の行き先はアカウント", () => {
    const step = steps.find((candidate) => candidate.id === "s02-bff-reply");
    expect(step?.places[0]?.href).toBe("/twitter/profile/mai2mai2");
  });

  it("post-101・post-102 は全フィールドが完全一致", () => {
    for (const expected of SNAPSHOT) {
      expect(getPost(expected.id), expected.id).toEqual(expected);
    }
  });

  it("段階1直後のDMで、ブログに着く前に閉鎖の話をしない", () => {
    if (!advice || !lead) throw new Error("カイの場面が見つからない");
    const afterAdvice = completeBeat(initialState, advice);
    expect(afterAdvice.flags).toContain("s01-blog-talk");
    expect(afterAdvice.flags).not.toContain("s03-blog-found");
    const next = availableBeats(afterAdvice).find(({ id }) => id === lead.id);
    expect(next).toBe(lead);
    expect([...chats(advice), ...chats(next), ...texts(next)].join("\n")).not.toMatch(
      /閉鎖|封鎖|閉じてた|消えてた|leafに記事を移行/,
    );
    expect(chats(next).filter((line) => chats(advice).includes(line))).toEqual([]);
    expect(availableBeats(afterAdvice).map(({ id }) => id)).not.toContain("ch3-blog-found");
  });

  it("アカウント → 投稿 → 返信 の順で開き、返信を開いた時点で段階2が成立する", async () => {
    if (!advice || !lead) throw new Error("カイの場面が見つからない");
    const progress = completeBeat(completeBeat(initialState, advice), lead);
    saveState(localStorage, progress);
    const embeds = chats(lead).flatMap((message) => resolveLinkEmbeds(message));
    expect(embeds.map(({ href }) => href)).toEqual(["/twitter/profile/mai2mai2"]);
    const handle = embeds[0].href.split("/").at(-1) ?? "";
    const profile = render(
      <StoryProvider>
        {await TwitterProfilePage({ params: Promise.resolve({ handle }) })}
      </StoryProvider>,
    );
    const postLink = within(screen.getByRole("region", { name: "ポスト" }))
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/twitter/post/post-101");
    expect(postLink).toBeDefined();
    expect(loadState(localStorage).flags).not.toContain("s02-bff-reply");
    profile.unmount();

    // 親の投稿を開いただけでは段階2は立たない（返信へのリンクは見えている）
    const postId = postLink?.getAttribute("href")?.split("/").at(-1) ?? "";
    const parentSeen: string[][] = [];
    const thread = render(
      <StoryProvider>
        {await TwitterPostPage({ params: Promise.resolve({ postId }) })}
        <FlagProbe onFlags={(flags) => parentSeen.push(flags)} />
      </StoryProvider>,
    );
    const replyLink = within(screen.getByRole("region", { name: "返信" }))
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/twitter/post/post-102");
    expect(replyLink).toBeDefined();
    await waitFor(() => expect(parentSeen.length).toBeGreaterThan(0));
    expect(parentSeen.at(-1)).not.toContain("s02-bff-reply");
    expect(loadState(localStorage).flags).not.toContain("s02-bff-reply");
    expect(loadState(localStorage).flags).not.toContain("s03-blog-found");
    thread.unmount();

    // 返信（post-102）を開くと、その本文が表示され、段階2が立つ
    const replyId = replyLink?.getAttribute("href")?.split("/").at(-1) ?? "";
    const replySeen: string[][] = [];
    render(
      <StoryProvider>
        {await TwitterPostPage({ params: Promise.resolve({ postId: replyId }) })}
        <FlagProbe onFlags={(flags) => replySeen.push(flags)} />
      </StoryProvider>,
    );
    expect(screen.getByText(SNAPSHOT[1].body)).toBeInTheDocument();
    await waitFor(() => expect(replySeen.at(-1)).toContain("s02-bff-reply"));
    expect(loadState(localStorage).flags).toContain("s02-bff-reply");
    expect(loadState(localStorage).flags).not.toContain("s03-blog-found");
  });
});
