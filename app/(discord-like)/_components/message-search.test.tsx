import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchMessages } from "@/app/(discord-like)/_actions/message-search";
import type { SearchHit } from "@/lib/discord-like/search";
import { MessageSearch } from "./message-search";

vi.mock("@/app/(discord-like)/_actions/message-search", () => ({
  searchMessages: vi.fn(),
}));

const hit: SearchHit = {
  id: "dm-maimai-0063",
  mode: "dm",
  threadUrlId: "1187002356428841501",
  channelLabel: "MaiMai",
  authorId: "maimai",
  authorName: "MaiMai",
  authorHandle: "maimaimaimai",
  sentAt: "2026-04-18T23:21:00+09:00",
  body: "なつかしい。あとでnoteにまとめたら？",
  pinned: false,
};

const mockedSearch = vi.mocked(searchMessages);

const openWithButton = () => {
  fireEvent.click(screen.getByRole("button", { name: "検索" }));
  return screen.getByRole("dialog", { name: "メッセージ検索" });
};

describe("MessageSearch", () => {
  beforeEach(() => {
    mockedSearch.mockReset();
    mockedSearch.mockResolvedValue({ ok: true, hits: [hit], total: 1, matchedUsers: [] });
  });

  it("検索バーから開き、入力へフォーカスし、Escで閉じて元のボタンへ戻る", async () => {
    render(<MessageSearch />);
    const dialog = openWithButton();

    const input = screen.getByLabelText("メッセージを検索");
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "検索" }));
  });

  it("Ctrl+F で開く", async () => {
    render(<MessageSearch />);
    fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    expect(await screen.findByRole("dialog", { name: "メッセージ検索" })).toBeInTheDocument();
  });

  it("Cmd+F（metaKey）でも開く", async () => {
    render(<MessageSearch />);
    fireEvent.keyDown(window, { key: "f", metaKey: true });
    expect(await screen.findByRole("dialog", { name: "メッセージ検索" })).toBeInTheDocument();
  });

  it("Tab / Shift+Tab がダイアログ内を循環する（背後へ漏れない）", async () => {
    render(<MessageSearch />);
    const dialog = openWithButton();
    const input = screen.getByLabelText("メッセージを検索");
    await waitFor(() => expect(document.activeElement).toBe(input));

    // ラジオはチェックされている1つだけが Tab の対象（ダイアログ内の最後になる）
    const last = dialog.querySelector<HTMLElement>('input[name="search-order"]:checked');
    expect(last).toBeInstanceOf(HTMLElement);

    // 最後の要素で Tab → 先頭（入力）へ戻る
    last?.focus();
    fireEvent.keyDown(last as HTMLElement, { key: "Tab" });
    expect(document.activeElement).toBe(input);

    // 先頭（入力）で Shift+Tab → 最後の要素へ進む
    input.focus();
    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("ダイアログの外にフォーカスがある状態で Tab を押すと中へ戻す", async () => {
    render(<MessageSearch />);
    openWithButton();
    const input = screen.getByLabelText("メッセージを検索");
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    fireEvent.keyDown(input, { key: "Tab" });
    expect(document.activeElement).toBe(input);
  });

  it("未入力では案内を出し、検索しない", () => {
    render(<MessageSearch />);
    openWithButton();
    expect(screen.getByText(/キーワードを入力してください/)).toBeInTheDocument();
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("不正なフィルタはその場で知らせ、検索しない", async () => {
    render(<MessageSearch />);
    openWithButton();
    fireEvent.change(screen.getByLabelText("メッセージを検索"), {
      target: { value: "note has:gif" },
    });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("has:gif");
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("結果に送信者・チャンネル・日時・強調を出し、0件も表示する", async () => {
    render(<MessageSearch />);
    openWithButton();
    fireEvent.change(screen.getByLabelText("メッセージを検索"), { target: { value: "note" } });

    expect(await screen.findByText("全1件中 1件を表示")).toBeInTheDocument();
    const result = screen.getByRole("button", { name: /MaiMai/ });
    expect(result).toHaveTextContent("DM・MaiMai");
    expect(result).toHaveTextContent("2026年4月18日 23:21");
    expect(result.querySelector("mark")).toHaveTextContent("note");

    mockedSearch.mockResolvedValue({ ok: true, hits: [], total: 0, matchedUsers: [] });
    fireEvent.change(screen.getByLabelText("メッセージを検索"), {
      target: { value: "存在しない語" },
    });
    expect(await screen.findByText("一致するメッセージはありません")).toBeInTheDocument();
  });

  it("並び順を切り替えると古い順で検索し直す", async () => {
    render(<MessageSearch />);
    openWithButton();
    fireEvent.change(screen.getByLabelText("メッセージを検索"), { target: { value: "note" } });
    await waitFor(() => expect(mockedSearch).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("radio", { name: "古い順" }));
    await waitFor(() =>
      expect(mockedSearch).toHaveBeenLastCalledWith(expect.objectContaining({ order: "old" })),
    );
  });

  it("矢印キーで結果へ移動できる", async () => {
    render(<MessageSearch />);
    openWithButton();
    const input = screen.getByLabelText("メッセージを検索");
    fireEvent.change(input, { target: { value: "note" } });
    await screen.findByText("全1件中 1件を表示");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const result = screen.getByRole("button", { name: /MaiMai/ });
    expect(document.activeElement).toBe(result);
  });
});
