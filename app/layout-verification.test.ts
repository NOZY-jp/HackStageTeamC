import { describe, expect, it, vi } from "vitest";
import { googleVerification, metadata } from "./layout";

const DUMMY_TOKEN = "dummy-token-for-test";

describe("Google Search Console の所有確認タグ（#77 第5段階）", () => {
  it("環境変数のトークンがあれば google の verification を返す", () => {
    expect(googleVerification(DUMMY_TOKEN)).toEqual({ google: DUMMY_TOKEN });
  });

  it("未設定・空文字なら何も出さない", () => {
    expect(googleVerification(undefined)).toBeUndefined();
    expect(googleVerification("")).toBeUndefined();
  });

  it("環境変数がある状態で読み込むと metadata に載る", async () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", DUMMY_TOKEN);
    vi.resetModules();
    const fresh = await import("./layout");
    expect(fresh.metadata.verification).toEqual({ google: DUMMY_TOKEN });
    vi.unstubAllEnvs();
  });

  it("未設定で読み込むと verification は undefined", async () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    vi.resetModules();
    const fresh = await import("./layout");
    expect(fresh.metadata.verification).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("metadataBase・title・description は変えていない", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://hack-stage-team-c.vercel.app/");
    expect(metadata.title).toEqual({ default: "HackStage", template: "%s | HackStage" });
    expect(metadata.description).toBe("チーム開発のためのDiscord風ワークスペース");
  });
});
