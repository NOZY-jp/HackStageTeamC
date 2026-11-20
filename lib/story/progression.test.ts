/**
 * 進行チェック: 謎解きの段階（steps.ts、正本 #76）の手がかりが、各プラットフォームのデータに本当にあるかを確かめる。
 * 共有の lib/story から各プラットフォームの lib を読むのはこのテストだけ（本体のコードは他の名前空間を import しない）。
 * 段階の status を done にしたら、ここに確認を足す。
 */
import { describe, expect, it } from "vitest";
import { getEntry, getMylist, listMylistEntries, listPublicEntries } from "@/lib/blog-like";
import { getChannel, getDMThread, getGuild } from "@/lib/discord-like";
import { users } from "@/lib/discord-like/data/users";
import { characters } from "./characters";
import { MAIMAI_DM_URL_ID, MHC_GUILD_URL_ID, NIGHT_VC_URL_ID } from "./places";
import { VOICE_CHANNELS } from "./stage";
import { STEP_IDS, steps } from "./steps";

const OLD_DISCORD_ID = characters.maimai.accounts.discordOldId;

describe("謎解きの段階の定義", () => {
  it("段階は #76 の順で 1 から並び、ID が重複しない", () => {
    expect(steps.map((step) => step.order)).toEqual(steps.map((_, index) => index + 1));
    expect(steps.map((step) => step.id)).toEqual([...STEP_IDS]);
  });

  it("アプリ内のパスは / から始まる", () => {
    for (const step of steps) {
      for (const place of step.places) {
        if (place.href) {
          expect(place.href.startsWith("/"), `${step.id}: ${place.href}`).toBe(true);
        }
      }
    }
  });
});

describe("進行チェック（各プラットフォームのデータに手がかりがあるか）", () => {
  it("段階3: 元のブログのトップは、閉鎖のお知らせだけが公開されている", () => {
    const visible = listPublicEntries("denden0102");
    expect(visible.map((entry) => entry.title)).toEqual(["ブログ閉鎖のお知らせ"]);
  });

  it("段階5: 古いIDと完全一致する Discord ユーザーが、オフラインでいる", () => {
    const old = users.find((user) => user.handle === OLD_DISCORD_ID);
    expect(old, OLD_DISCORD_ID).toBeDefined();
    expect(old?.status).toBe("offline");
  });

  it("段階6: そのプロフィールのリンクは、ブログのトップではなく記事一覧（マイリスト）で、実在する", () => {
    const old = users.find((user) => user.handle === OLD_DISCORD_ID);
    const link = old?.profileUrl ?? "";
    expect(link.startsWith("/pochiblo/mylist/"), link).toBe(true);
    const mylist = getMylist(link.split("/").at(-1) ?? "");
    expect(mylist, link).toBeDefined();
  });

  it("段階7: 記事一覧に、トップには出ない写真コンテストの記事がある", () => {
    const entry = getEntry("denden0102", "e20181117");
    expect(entry?.visibility).toBe("unlisted");
    const mylist = getMylist("k7q2m9d4");
    if (!mylist) throw new Error("mylist missing");
    expect(listMylistEntries(mylist).map((item) => item.id)).toContain("e20181117");
  });

  it.todo("段階7・8: コンテスト名が造語「蒼穹フォトアワード 2020」になっている（#77）");
  it.todo("段階2: Twixer にかのんの「○○にも書いてたよな」リプライがある");
  it.todo("段階10: talkup に本人のプロフィールと写真がある");
});

describe("物語のチャットの流し先（lib/story/places.ts）", () => {
  it("MaiMai との DM の URL が Discord のデータと一致する", () => {
    expect(getDMThread("dm-maimai")?.urlId).toBe(MAIMAI_DM_URL_ID);
  });

  it("通話の場所が Discord のボイスチャンネルで、URL も一致する", () => {
    expect(getGuild("mhc")?.urlId).toBe(MHC_GUILD_URL_ID);
    for (const key of Object.keys(VOICE_CHANNELS)) {
      const channel = getChannel(key.replace(/^discord:/, ""));
      expect(channel?.kind).toBe("voice");
    }
    expect(getChannel("mhc-vc-3")?.urlId).toBe(NIGHT_VC_URL_ID);
  });
});
