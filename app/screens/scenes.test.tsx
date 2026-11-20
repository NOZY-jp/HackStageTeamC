import fs from "node:fs/promises";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MAIMAI_HANDLE, OLD_DISPLAY_NAME, OLD_HANDLE } from "@/lib/discord-like/data/names";
import { DiscordFriendsScene, GameScene, LobbyScene } from "./_components/scenes";
import { CURRENT_ID, GAME_OLD_ID, OLD_DISCORD_ID, SCENE_IDS, SCREEN_SCENES } from "./scenes";

/** PNG の IHDR から幅・高さを読む（画像の実寸を確認する）。 */
async function pngSize(path: string): Promise<{ width: number; height: number; bytes: number }> {
  const buffer = await fs.readFile(path);
  // 8 バイトのシグネチャ + 4 バイト長 + "IHDR" + 幅(4) + 高さ(4)
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: buffer.byteLength,
  };
}

describe("順序4の撮影用モック画面（#103）", () => {
  it("画面のIDはデータ側の定数と完全一致する", () => {
    expect(GAME_OLD_ID).toBe("hunter_denden");
    expect(GAME_OLD_ID).toBe(OLD_DISPLAY_NAME);
    expect(CURRENT_ID).toBe("maimaimaimai");
    expect(CURRENT_ID).toBe(MAIMAI_HANDLE);
    expect(OLD_DISCORD_ID).toBe("hunter_denden3243");
    expect(OLD_DISCORD_ID).toBe(OLD_HANDLE);
  });

  it("各画面の HTML テキストに、その画面のIDがそのまま出る", () => {
    const game = render(<GameScene />);
    expect(game.container.textContent).toContain(GAME_OLD_ID);
    game.unmount();

    const discord = render(<DiscordFriendsScene />);
    expect(discord.container.textContent).toContain(CURRENT_ID);
    // 2018年の旧IDは、2026年のフレンド一覧には出さない
    expect(discord.container.textContent).not.toContain(GAME_OLD_ID);
    discord.unmount();

    const lobby = render(<LobbyScene />);
    expect(lobby.container.textContent).toContain(GAME_OLD_ID);
    expect(lobby.container.textContent).toContain(OLD_DISCORD_ID);
  });

  it("撮影した PNG が public にあり、画面と同じ実寸・サイズになっている", async () => {
    expect(SCENE_IDS).toHaveLength(3);
    for (const id of SCENE_IDS) {
      const scene = SCREEN_SCENES[id];
      expect(scene.output.startsWith("/discord-like/")).toBe(true);
      const size = await pngSize(`public${scene.output}`);
      expect(size.width).toBe(scene.width);
      expect(size.height).toBe(scene.height);
      // 単色の空画像ではない（ある程度の情報量がある）
      expect(size.bytes).toBeGreaterThan(5_000);
    }

    // 仕様のサイズ（1200×675 / 800×600 / 800×600）
    expect(await pngSize(`public${SCREEN_SCENES.game2018.output}`)).toMatchObject({
      width: 1200,
      height: 675,
    });
    expect(await pngSize(`public${SCREEN_SCENES.discord2026.output}`)).toMatchObject({
      width: 800,
      height: 600,
    });
    expect(await pngSize(`public${SCREEN_SCENES.lobby2019.output}`)).toMatchObject({
      width: 800,
      height: 600,
    });
  });
});
