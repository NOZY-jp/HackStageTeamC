import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarUserPanel } from "./sidebar-user-panel";

describe("SidebarUserPanel", () => {
  it("名前の下は既定でステータス文言を出す", () => {
    render(<SidebarUserPanel userId="u4" />);

    expect(screen.getByText("メンバー04")).toBeInTheDocument();
    expect(screen.getByText("オンライン")).toBeInTheDocument();
  });

  it("idle は「退席中」と表示し、ハンドルに @ を付けない", () => {
    const { container } = render(<SidebarUserPanel userId="u1" />);

    expect(screen.getByText("退席中")).toBeInTheDocument();
    expect(screen.getByText("member01")).toBeInTheDocument();
    expect(container.textContent).not.toContain("@member01");
  });

  it("ボイス操作のアイコンボタンが5つあり、すべてにアクセシブル名がある", () => {
    render(<SidebarUserPanel userId="u4" />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
    }
  });
});
