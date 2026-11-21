import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FacebookProvider } from "./facebook-context";
import { FacebookHeader } from "./header";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const REAL_NAME = `${FAMILY_NAME} ${GIVEN_NAME}`;

const nav = {
  pathname: "/talkup",
  query: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.query,
  useRouter: () => ({ push: nav.push, replace: nav.replace, refresh: nav.refresh }),
}));

const renderHeader = () =>
  render(
    <FacebookProvider>
      <FacebookHeader />
    </FacebookProvider>,
  );

describe("FacebookHeader", () => {
  beforeEach(() => {
    nav.pathname = "/talkup";
    nav.query = new URLSearchParams();
    nav.push.mockReset();
    nav.replace.mockReset();
    nav.refresh.mockReset();
  });

  it("一般語・1文字・姓や名だけではドロップダウンに u40 を出さない", async () => {
    const user = userEvent.setup();
    renderHeader();

    const searchBox = screen.getByRole("searchbox", { name: "投稿やメンバーを検索" });

    for (const q of ["UI", "写真", "o", FAMILY_NAME, GIVEN_NAME]) {
      await user.clear(searchBox);
      await user.type(searchBox, q);

      expect(screen.queryByText(REAL_NAME), q).not.toBeInTheDocument();
      expect(screen.queryByText("@yui__photo"), q).not.toBeInTheDocument();
    }

    await user.clear(searchBox);
    await user.type(searchBox, "member02");
    const listbox = screen.getByRole("listbox", { name: "ユーザー検索結果" });
    expect(within(listbox).getByText("メンバー02")).toBeInTheDocument();
    expect(within(listbox).queryByText(REAL_NAME)).not.toBeInTheDocument();
  });

  it("本名を入力するとドロップダウンに u40 を表示する", async () => {
    const user = userEvent.setup();
    renderHeader();

    const searchBox = screen.getByRole("searchbox", { name: "投稿やメンバーを検索" });

    for (const q of [REAL_NAME]) {
      await user.clear(searchBox);
      await user.type(searchBox, q);

      const listbox = screen.getByRole("listbox", { name: "ユーザー検索結果" });
      expect(within(listbox).getByText(REAL_NAME), q).toBeInTheDocument();
      expect(within(listbox).getByText("@yui__photo"), q).toBeInTheDocument();
    }
  });

  it("フィード以外のページで先頭に空白を入力した後に検索語を打つと /talkup?q=... へ遷移する", async () => {
    nav.pathname = "/talkup/profile/member01";
    const user = userEvent.setup();
    renderHeader();

    const searchBox = screen.getByRole("searchbox", { name: "投稿やメンバーを検索" });

    await user.type(searchBox, " ");
    expect(nav.push).not.toHaveBeenCalled();

    await user.type(searchBox, " Espresso");
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push.mock.calls[0]?.[0]).toMatch(/^\/talkup\?q=/);
    expect(searchBox).toHaveValue("  Espresso");
  });
});
