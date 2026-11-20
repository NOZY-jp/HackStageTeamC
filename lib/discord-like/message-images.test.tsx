import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageAttachments } from "@/app/(discord-like)/_components/message-attachments";
import { getMessageImage, MESSAGE_IMAGES, OLD_GAMER_ID } from "./data/message-images";
import { MAIMAI_HANDLE } from "./data/names";
import { listDMMessages } from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);

const DM_IMAGE = "screenshot-2026.png";
const BLOG_IMAGE = "screenshot-2018.png";

describe("順序4の画像の向きとパス（#102）", () => {
  it("Discord のスクショは現在のID、旧ブログの画像は旧ID", () => {
    expect(getMessageImage(DM_IMAGE).owner).toBe("current");
    expect(getMessageImage(DM_IMAGE).handle).toBe(MAIMAI_HANDLE);
    expect(getMessageImage(DM_IMAGE).handle).toBe("maimaimaimai");

    expect(getMessageImage(BLOG_IMAGE).owner).toBe("old");
    expect(getMessageImage(BLOG_IMAGE).handle).toBe(OLD_GAMER_ID);
    expect(getMessageImage(BLOG_IMAGE).handle).toBe("hunter_denden3243");
  });

  it("画像パスは message-images.ts の1か所だけで決まる", () => {
    for (const image of Object.values(MESSAGE_IMAGES)) {
      expect(image.src.startsWith("/")).toBe(true);
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
      expect(image.label.length).toBeGreaterThan(0);
    }
    // 実体がある画像は ready、無い画像は pending
    expect(Object.values(MESSAGE_IMAGES).every((image) => image.status === "ready")).toBe(true);
  });

  it("未定義の画像は向き不明（unknown）として扱う", () => {
    const unknown = getMessageImage("not-defined.png");
    expect(unknown.owner).toBe("unknown");
    expect(unknown.handle).toBe("");
    expect(unknown.status).toBe("pending");
  });

  it("DM の画像メッセージは、現在のIDのスクショを指している", () => {
    const messages = listDMMessages({ threadId: "dm-maimai", limit: 1000 }).messages;
    const withImage = messages.filter((message) =>
      (message.attachments ?? []).some((attachment) => attachment.kind === "image"),
    );
    expect(withImage.length).toBeGreaterThan(0);
    for (const message of withImage) {
      for (const attachment of message.attachments ?? []) {
        if (attachment.kind !== "image") {
          continue;
        }
        expect(attachment.name).toBe(DM_IMAGE);
        expect(getMessageImage(attachment.name).owner).toBe("current");
        // 貼るのは MaiMai 自身で、「今のアカウント」の画像だと分かる本文
        expect(message.authorId).toBe("maimai");
        expect(message.body).toContain("今のアカウント");
      }
    }
  });

  it("実体が無い画像でも、プレースホルダ用の説明を持つ（「画像を読み込めません」にしない）", async () => {
    const source = await fs.readFile(
      "app/(discord-like)/_components/message-attachments.tsx",
      "utf8",
    );
    expect(source).not.toContain("画像を読み込めません");
    expect(source).toContain("画像は準備中です");
    // パスの組み立ては sidecar に集約（コンポーネント側で /mock/ を書かない）
    expect(source).not.toContain("`/mock/${");
  });

  it("本名は画像の定義に出さない", () => {
    const text = JSON.stringify(MESSAGE_IMAGES);
    expect(text).not.toContain(FAMILY_NAME);
    expect(text).not.toContain(GIVEN_NAME);
  });
});

describe("実体が無い画像の扱い（#102 追補）", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pending の添付は <img> を描かず、最初からプレースホルダを出す", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <MessageAttachments
        attachments={[{ id: "att", name: "not-yet.png", kind: "image", sizeLabel: "412 KB" }]}
      />,
    );

    // (a) 画像要素を作らない＝リクエストを出さない
    expect(container.querySelector("img")).toBeNull();
    // (b) プレースホルダ文言
    expect(screen.getByText(/画像は準備中です/)).toBeInTheDocument();
    expect(screen.queryByText(/画像を読み込めません/)).not.toBeInTheDocument();
    // (c) コンソールエラーを出さない
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("ready の添付は <img> を描く", () => {
    const { container } = render(
      <MessageAttachments attachments={[{ id: "att", name: BLOG_IMAGE, kind: "image" }]} />,
    );
    expect(container.querySelector("img")).not.toBeNull();
    const src = decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "");
    expect(src).toContain("screenshot-2018-game.png");
  });

  it("実体の有無はデータの status で決まる（定義済みは ready、未定義は pending）", () => {
    expect(getMessageImage(DM_IMAGE).status).toBe("ready");
    expect(getMessageImage(BLOG_IMAGE).status).toBe("ready");
    expect(getMessageImage("not-yet.png").status).toBe("pending");
  });
});

describe("撮影画像の取り残し防止（#102 / #103）", () => {
  // #105 d0b940a（2026年を MaiMai 本人視点にし、旧注記とカイを外して撮り直した画像）。撮り直したら更新する
  const EXPECTED_SHA256: Record<string, string> = {
    "public/discord-like/screenshot-2018-game.png":
      "514f51c50c8842b66134f33ca8fbb39c95e491960afa1d58189dc6c9d7abdb79",
    "public/discord-like/screenshot-2019-lobby.png":
      "c1815ed3edbe3dca106bc855530621d1764d9633d4db4ef63465867a147043eb",
    "public/discord-like/screenshot-2026-friends.png":
      "abf5afc17a27ee3c95fa467f73d255b2e770c75462a13032f4e59aa252682d2d",
  };

  it("ゲーム画面の画像が最新（古い ID の画像が残っていない）", async () => {
    const crypto = await import("node:crypto");
    for (const [path, expected] of Object.entries(EXPECTED_SHA256)) {
      const buffer = await fs.readFile(path);
      const actual = crypto.createHash("sha256").update(buffer).digest("hex");
      expect(actual, path).toBe(expected);
    }
  });
});
