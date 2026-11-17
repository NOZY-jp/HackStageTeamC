import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { listPosts } from "@/lib/facebook-like";
import { FacebookProvider } from "./facebook-context";
import { PostCard } from "./post-card";

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
