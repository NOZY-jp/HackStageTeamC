import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageAttachments } from "@/app/(discord-like)/_components/message-attachments";
import { getMessageImage, MESSAGE_IMAGES, OLD_TWIXER_HANDLE } from "./data/message-images";
import { MAIMAI_HANDLE } from "./data/names";
import { listDMMessages } from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);

const DM_IMAGE = "screenshot-2026.png";
const BLOG_IMAGE = "screenshot-2019.svg";

describe("順序4の画像の向きとパス（#102）", () => {
  it("Discord のスクショは現在のID、旧ブログの画像は旧ID", () => {
    expect(getMessageImage(DM_IMAGE).owner).toBe("current");
    expect(getMessageImage(DM_IMAGE).handle).toBe(MAIMAI_HANDLE);
    expect(getMessageImage(DM_IMAGE).handle).toBe("maimaimaimai");

    expect(getMessageImage(BLOG_IMAGE).owner).toBe("old");
    expect(getMessageImage(BLOG_IMAGE).handle).toBe(OLD_TWIXER_HANDLE);
    expect(getMessageImage(BLOG_IMAGE).handle).toBe("hunter_denden0102");
  });

  it("画像パスは message-images.ts の1か所だけで決まる（実体が無くても解決できる）", () => {
    for (const image of Object.values(MESSAGE_IMAGES)) {
      expect(image.src).toBe(`/mock/${image.name}`);
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
      expect(image.label.length).toBeGreaterThan(0);
    }
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
        // 「あの頃のスクショ」ではなく、今のアカウントの画像だと分かる本文
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
        attachments={[{ id: "att", name: DM_IMAGE, kind: "image", sizeLabel: "412 KB" }]}
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
    expect(container.querySelector("img")?.getAttribute("src")).toContain(BLOG_IMAGE);
  });

  it("実体の有無はデータの status で決まる（pending は 2026 のスクショだけ）", () => {
    expect(getMessageImage(DM_IMAGE).status).toBe("pending");
    expect(getMessageImage(BLOG_IMAGE).status).toBe("ready");
  });
});
