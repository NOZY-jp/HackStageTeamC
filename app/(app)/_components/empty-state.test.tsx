import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("見出しと補足を表示する", () => {
    render(
      <EmptyState
        kind="message"
        title="まだメッセージがありません"
        description="下の入力欄から送信できます。"
      />,
    );

    expect(screen.getByText("まだメッセージがありません")).toBeInTheDocument();
    expect(screen.getByText("下の入力欄から送信できます。")).toBeInTheDocument();
  });

  it("補足を省略できる", () => {
    render(<EmptyState kind="voice" title="参加者はいません" />);

    expect(screen.getByText("参加者はいません")).toBeInTheDocument();
    expect(screen.queryByText("下の入力欄から送信できます。")).not.toBeInTheDocument();
  });
});
