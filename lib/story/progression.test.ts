/**
 * 進行チェック: 謎解きの段階（steps.ts、正本 #76）の手がかりが、各プラットフォームのデータに本当にあるかを確かめる。
 * 共有の lib/story から各プラットフォームの lib を読むのはこのテストだけ（本体のコードは名前の定数しか import しない）。
 * 段階の status を done にしたら、ここに確認を足す。
 */
import { describe, expect, it } from "vitest";
import { getEntry, getMylist, listMylistEntries, listPublicEntries } from "@/lib/blog-like";
import { getChannel, getDMThread, getGuild, listGuilds } from "@/lib/discord-like";
import { channelMessages, dmMessages } from "@/lib/discord-like/data/messages";
import { users } from "@/lib/discord-like/data/users";
import { buildSearchIndex } from "@/lib/discord-like/search";
import { characters } from "./characters";
import {
  availableBeats,
  choose,
  completeBeat,
  completedChats,
  initialState,
  setFlag,
  transcript,
} from "./engine";
import { MAIMAI_DM_URL_ID, MHC_GUILD_URL_ID, NIGHT_VC_URL_ID } from "./places";
import { STORY_NOW } from "./scenario/kai-contact";
import { OLD_BLOG_ID } from "./sites";
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

/** Discord の過去の会話（DM とサーバーのチャンネル）を全部 */
const allDiscordMessages = [
  ...Object.values(dmMessages).flat(),
  ...Object.values(channelMessages).flat(),
];

describe("進行チェック（各プラットフォームのデータに手がかりがあるか）", () => {
  it("段階1: MaiMai との DM に、中学生の頃に攻略ブログを書いていたという話がある", () => {
    const talk = (dmMessages["dm-maimai"] ?? []).filter(
      (message) => message.authorId === "maimai" && message.body.includes("攻略ブログ"),
    );
    expect(talk.length).toBeGreaterThan(0);
  });

  it("11月25日までの通常ログはゲーム開始より前にある", () => {
    const times = allDiscordMessages.map((message) => message.sentAt).sort();
    expect(times.at(-1)?.slice(0, 10)).toBe(STORY_NOW.slice(0, 10));
    expect(Date.parse(times.at(-1) ?? "")).toBeLessThan(Date.parse(STORY_NOW));
  });

  it("主要なログは前年11月25日から当年11月25日まで、月を飛ばさずに続く", () => {
    const startDate = "2025-11-25";
    const endDate = STORY_NOW.slice(0, 10);
    const months: string[] = [];
    const cursor = new Date("2025-11-01T00:00:00Z");
    while (cursor.toISOString().slice(0, 7) <= endDate.slice(0, 7)) {
      months.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    const groups = [
      { id: "dm-maimai", messages: dmMessages["dm-maimai"] },
      ...listGuilds().map(({ id, channels }) => ({
        id,
        messages: channels
          .filter(({ kind }) => kind === "text")
          .flatMap(({ id }) => channelMessages[id] ?? []),
      })),
    ];
    for (const { id, messages } of groups) {
      const dates = (messages ?? [])
        .filter(({ system }) => system !== true)
        .map(({ sentAt }) => sentAt.slice(0, 10))
        .filter((day) => day >= startDate && day <= endDate)
        .sort();
      expect([...new Set(dates.map((day) => day.slice(0, 7)))], id).toEqual(months);
    }
  });

  it("進行前のDiscord履歴と検索に、カイの助言や結末は含まれない", () => {
    const plotText = /本名で検索|でんちゃん|住所を特定しました|例の件、どこまで進んだ/;
    expect(allDiscordMessages.filter((message) => plotText.test(message.body))).toEqual([]);
    expect(buildSearchIndex().documents.filter((doc) => plotText.test(doc.body))).toEqual([]);
    expect(availableBeats(initialState).some((beat) => beat.place === "discord:dm-kai")).toBe(
      false,
    );
    expect(completedChats(initialState)).toEqual([]);
  });

  it("カイの助言は段階8のあとに届き、結末は段階10を経て選んだときだけDMに残る", () => {
    const atName = setFlag(initialState, "s08-real-name");
    const contact = availableBeats(atName).find((beat) => beat.place === "discord:dm-kai");
    if (!contact) throw new Error("カイの連絡が始まらない");
    const afterContact = completeBeat(atName, contact);
    expect(afterContact.flags).toContain("s09-kai-contact");
    expect(completedChats(afterContact)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "kai",
          channel: "discord:dm-kai",
          text: expect.stringContaining("本名で検索"),
        }),
      ]),
    );
    expect(availableBeats(afterContact).some((beat) => beat.place === "discord:dm-kai")).toBe(
      false,
    );

    const atMatch = setFlag(afterContact, "s10-talkup-match");
    const closing = availableBeats(atMatch).find((beat) => beat.place === "discord:dm-kai");
    if (!closing) throw new Error("結末を送信できる場面がない");
    expect(completedChats(atMatch).some((chat) => chat.text === "住所を特定しました")).toBe(false);
    const send = closing.choices?.find((choice) => choice.label === "住所を特定しました");
    if (!send) throw new Error("結末の送信を選択できない");
    const ended = choose(atMatch, closing, send.id);
    expect(ended.flags).toContain("s11-address");
    expect(completedChats(ended).at(-1)).toMatchObject({
      from: "ryo",
      channel: "discord:dm-kai",
      text: "住所を特定しました",
    });
    expect(transcript(ended).at(-1)?.lines).toContainEqual(
      expect.objectContaining({ text: "住所を特定しました" }),
    );
  });

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

describe("ブックマークのリンク先（lib/story/sites.ts）", () => {
  it("旧ブログの ID が、ぽちブロのデータと一致する", () => {
    expect(listPublicEntries(OLD_BLOG_ID).length).toBeGreaterThan(0);
  });
});
