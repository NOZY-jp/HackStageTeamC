import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLinkEmbeds } from "@/app/(discord-like)/_actions/link-embed";
import { MessageEmbeds } from "./message-embeds";

// カードの解決はサーバー側。部品のテストでは差し替える
vi.mock("@/app/(discord-like)/_actions/link-embed", () => ({
  fetchLinkEmbeds: vi.fn(),
}));

const mocked = vi.mocked(fetchLinkEmbeds);

beforeEach(() => {
  mocked.mockReset();
});

const twixerEmbed = {
  href: "/twitter/post/post-101",
  siteName: "Twixer",
  title: "Mai（@mai2mai2）",
  description: "双剣、クラッチクローから弱点に当てるのがまだ安定しない。",
  accentColor: "#1d9bf0",
};

describe("MessageEmbeds（アプリ内URLの埋め込みカード）", () => {
  it("解決できたURLは、左の帯つきカードで出て、リンク先はアプリ内パス", async () => {
    mocked.mockResolvedValue([twixerEmbed]);
    const { container } = render(
      <MessageEmbeds body="これ https://twixer.com/mai2mai2/status/post-101" />,
    );

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/twitter/post/post-101");
    expect(link).toHaveTextContent("Twixer");
    expect(link).toHaveTextContent("Mai（@mai2mai2）");
    expect(link).toHaveTextContent("双剣");

    const band = container.querySelector(".message-embed-band") as HTMLElement;
    expect(band.style.backgroundColor).toBe("rgb(29, 155, 240)");
  });

  it("URL が無い本文ではサーバーへ聞かない", () => {
    render(<MessageEmbeds body="URL はないよ" />);
    expect(mocked).not.toHaveBeenCalled();
  });

  it("外部URLなど解決できないものはカードを出さない", async () => {
    mocked.mockResolvedValue([]);
    const { container } = render(<MessageEmbeds body="https://example.com/x" />);
    await waitFor(() => expect(mocked).toHaveBeenCalled());
    expect(container.querySelector(".message-embed")).toBeNull();
  });
});
