import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { type DmThreadItem, DmThreadList } from "./dm-thread-list";

const nav = { path: "" };
vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
}));

const thread = (id: string, urlId: string, name: string): DmThreadItem => ({
  id,
  urlId,
  name,
  avatarColor: "#5865f2",
  status: "online",
  preview: "こんにちは",
  time: "12:34",
  unread: 0,
});

const THREADS = [thread("t1", "111", "MaiMai"), thread("t2", "222", "χ")];

describe("DM 一覧のハイライト（#70）", () => {
  it("pathname と一致するスレッドだけ aria-current を付ける", () => {
    nav.path = dmThreadPath("222");
    render(<DmThreadList threads={THREADS} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("aria-current")).toBeNull();
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("末尾スラッシュやエンコード差でも一致とみなす", () => {
    nav.path = `${dmThreadPath("111")}/`.replace("@me", "%40me");
    render(<DmThreadList threads={THREADS} />);

    expect(screen.getAllByRole("link")[0].getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("link")[1].getAttribute("aria-current")).toBeNull();
  });
});
