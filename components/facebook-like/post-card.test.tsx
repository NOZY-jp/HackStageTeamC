import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { listPosts } from "@/lib/facebook-like";
import { FacebookProvider, useFacebook } from "./facebook-context";
import { PostCard } from "./post-card";

// FacebookProvider は URL の ?q= を初期検索値に使う（このテストでは検索なし）
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/talkup",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

describe("PostCard", () => {
  it("toggles reaction and appends a new comment", async () => {
    const user = userEvent.setup();
    const initialPost = listPosts().find((p) => p.id === "fbp-102");
    expect(initialPost).toBeDefined();
    if (!initialPost) return;

    render(
      <FacebookProvider>
        <PostCard post={initialPost} />
      </FacebookProvider>,
    );

    const likeBtn = screen.getByRole("button", { name: "いいね！" });
    expect(likeBtn).toHaveAttribute("aria-pressed", "false");
    await user.click(likeBtn);

    const input = screen.getByPlaceholderText("コメントを入力...");
    await user.type(input, "テストコメントです");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByPlaceholderText("コメントを入力...")).toHaveValue("");
  });
});

/**
 * 実アプリと同じく、context が保持する投稿（状態更新後のデータ）を
 * PostCard に渡して描画するためのハーネス。
 * 固定 props ではリアクション・コメント操作が画面に反映されないため、
 * 操作後の表示変化を検証できるようにしている。
 */
function PostCardFromContext({ postId }: { postId: string }) {
  const { posts } = useFacebook();
  const post = posts.find((candidate) => candidate.id === postId);
  if (!post) {
    return null;
  }
  return <PostCard post={post} />;
}

describe("PostCard（context 連携）", () => {
  it("いいね！を押すとリアクション数とボタンの表示が変化し、もう一度押すと元に戻る", async () => {
    const user = userEvent.setup();
    // fbp-102 は初期リアクション like 8 + wow 1 = 9件
    render(
      <FacebookProvider>
        <PostCardFromContext postId="fbp-102" />
      </FacebookProvider>,
    );

    expect(screen.getByText("9件のリアクション")).toBeInTheDocument();

    const likeBtn = screen.getByRole("button", { name: "いいね！" });
    expect(likeBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(likeBtn);

    expect(likeBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("10件のリアクション")).toBeInTheDocument();

    await user.click(likeBtn);

    expect(likeBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("9件のリアクション")).toBeInTheDocument();
  });

  it("リアクションピッカーで超いいね！を選ぶと絵文字ラベルに切り替わる", async () => {
    const user = userEvent.setup();
    render(
      <FacebookProvider>
        <PostCardFromContext postId="fbp-102" />
      </FacebookProvider>,
    );

    expect(screen.getByText("9件のリアクション")).toBeInTheDocument();

    // リアクション欄にホバーしてピッカーを開く
    const reactionField = screen.getByRole("group", { name: "リアクション" });
    await user.hover(reactionField);

    // jsdom + userEvent の環境では、ピッカーのボタンへポインタを動かすと
    // fieldset の mouseleave が先に発火してピッカーが閉じてしまい click が届かないため、
    // ピッカーが開いた状態のまま直接 click イベントを発火させる
    fireEvent.click(screen.getByRole("button", { name: "超いいね！" }));

    // ピッカーは閉じ、アクションボタンのラベルが「超いいね！」に切り替わる
    const loveBtn = screen.getByRole("button", { name: "超いいね！" });
    expect(loveBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("10件のリアクション")).toBeInTheDocument();
  });

  it("コメントを送信するとコメント数が増え、本文がコメント欄に表示される", async () => {
    const user = userEvent.setup();
    // fbp-102 は初期コメント 1件
    render(
      <FacebookProvider>
        <PostCardFromContext postId="fbp-102" />
      </FacebookProvider>,
    );

    expect(screen.getByRole("link", { name: "コメント 1件" })).toBeInTheDocument();

    const input = screen.getByPlaceholderText("コメントを入力...");
    await user.type(input, "追加コメントのテストです");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByRole("link", { name: "コメント 2件" })).toBeInTheDocument();
    expect(screen.getByText("追加コメントのテストです")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
