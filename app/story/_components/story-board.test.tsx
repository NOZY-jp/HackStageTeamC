import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/lib/story";
import { StoryBoard } from "./story-board";

beforeEach(() => {
  window.localStorage.clear();
});

describe("シナリオ確認画面（#81）", () => {
  it("台帳・きっかけ・空の履歴を出す", async () => {
    render(<StoryBoard />);

    // マウント後に localStorage を読む
    expect(await screen.findByRole("heading", { name: "シナリオ確認" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "きっかけ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "マイリストを開く" })).toBeEnabled();
    expect(screen.getByText("まだ会話はありません。")).toBeInTheDocument();
    // 台帳（本名ではなく表示名）
    expect(screen.getByRole("cell", { name: "リョウ" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "カイ" })).toBeInTheDocument();
  });

  it("きっかけ→場面→選択肢→次の場面、と進み、履歴に残る", async () => {
    const user = userEvent.setup();
    render(<StoryBoard />);
    await screen.findByRole("heading", { name: "シナリオ確認" });

    // きっかけ
    await user.click(screen.getByRole("button", { name: "マイリストを開く" }));

    expect(screen.getByRole("heading", { name: "助言：マイリストの通知" })).toBeInTheDocument();
    expect(screen.getByText(/マイリスト開いたんだ/)).toBeInTheDocument();

    // 選択肢
    await user.click(screen.getByRole("button", { name: "覚えてる。見に行く" }));

    // 1場面終わると 1/4。次は本名が分かった後の「痕跡」なので、まだ場面は出ない
    expect(screen.getByText(/終わった場面: 1 \/ 4/)).toBeInTheDocument();
    // 履歴に残る（選んだ答えつき）
    expect(screen.getByText("選んだ答え: 覚えてる。見に行く")).toBeInTheDocument();
    // localStorage に保存されている
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("ch1-mylist");
    });
  });

  it("やり直すと最初の状態に戻る", async () => {
    const user = userEvent.setup();
    render(<StoryBoard />);
    await screen.findByRole("heading", { name: "シナリオ確認" });

    await user.click(screen.getByRole("button", { name: "マイリストを開く" }));
    await user.click(screen.getByRole("button", { name: "覚えてる。見に行く" }));
    expect(screen.getByText(/終わった場面: 1 \/ 4/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "最初からやり直す" }));
    expect(screen.getByText(/終わった場面: 0 \/ 4/)).toBeInTheDocument();
    expect(screen.getByText("まだ会話はありません。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "マイリストを開く" })).toBeEnabled();
  });
});
