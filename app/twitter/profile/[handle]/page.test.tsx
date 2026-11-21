import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import TwitterProfilePage from "./page";

describe("TwitterProfilePage", () => {
  it.each([
    { handle: HAL_HANDLE, action: "プロフィールを編集" },
    { handle: "kanon__dayo", action: "フォロー" },
  ])("$action ボタンを無効状態で表示する", async ({ handle, action }) => {
    render(await TwitterProfilePage({ params: Promise.resolve({ handle }) }));
    const profile = within(screen.getByRole("region", { name: "プロフィール" }));
    expect(profile.getByRole("button", { name: action })).toBeDisabled();
  });
});
