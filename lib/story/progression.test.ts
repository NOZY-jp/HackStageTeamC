/**
 * 進行チェック: 謎解きの段階（steps.ts、正本 #76）の手がかりが、各プラットフォームのデータに本当にあるかを確かめる。
 * 共有の lib/story から各プラットフォームの lib を読むのはこのテストだけ（本体のコードは名前の定数しか import しない）。
 * 段階の status を done にしたら、ここに確認を足す。
 */
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getEntry, getMylist, listMylistEntries, listPublicEntries } from "@/lib/blog-like";
import { LEAF_CREATOR_ID } from "@/lib/blog-like/data/names";
import { getChannel, getDMThread, getGuild } from "@/lib/discord-like";
import { channelMessages, dmMessages } from "@/lib/discord-like/data/messages";
import { users } from "@/lib/discord-like/data/users";
import {
  filterFeedPosts,
  getPostById as getTalkupPostById,
  getUserByHandle as getTalkupUserByHandle,
  listFollowers as listTalkupFollowers,
  listFollowing as listTalkupFollowing,
  listPosts as listTalkupPosts,
  searchFacebook,
} from "@/lib/facebook-like";
import { KAI_TALKUP_HANDLE, KAI_TALKUP_USER_ID } from "@/lib/facebook-like/data/users";
import { getArticle as getNoteArticle } from "@/lib/note-like";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { getPost as getTwitterPost } from "@/lib/twitter-like";
import { KANON_STALKER_POST_ID } from "@/lib/twitter-like/data/twitter";
import { characters, FORBIDDEN_WORDS } from "./characters";
import {
  KAI_DM_URL_ID,
  KAI_NICKNAME_ADVICE_MESSAGE_ID,
  MAIMAI_DM_URL_ID,
  MHC_GUILD_URL_ID,
  NIGHT_VC_URL_ID,
  PLACES,
} from "./places";
import { beats } from "./scenario";
import { OLD_BLOG_ID } from "./sites";
import { CHAT_CHANNELS, chatsOf, textsOf, VOICE_CHANNELS } from "./stage";
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

  it("11段階すべての手がかりが実装済み（done: true）になっている", () => {
    for (const step of steps) {
      expect(step.status, step.id).toEqual({ done: true });
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

  it("段階2: Twixer のリプライ（post-102）に「ブログ」と構成ヒントがあり、ブログ名や禁止語を出さない", () => {
    const post101 = getTwitterPost("post-101");
    const post102 = getTwitterPost("post-102");
    expect(post101).toBeDefined();
    expect(post102?.replyToId).toBe("post-101");
    expect(post102?.body).toContain("ブログ");
    expect(post102?.body).toContain("弓属性強化ガン積み構成");
    expect(post102?.body).not.toContain("でんでんの狩猟日記");
    for (const word of FORBIDDEN_WORDS) {
      expect(post102?.body).not.toContain(word);
    }
  });

  it("段階3: 元のブログのトップは、閉鎖のお知らせだけが公開されている", () => {
    const visible = listPublicEntries("denden0102");
    expect(visible.map((entry) => entry.title)).toEqual(["ブログ閉鎖のお知らせ"]);
  });

  it("段階4: leaf に旧IDが写る記事（maimai-2020-02-screenshot）があり、弓構成の記事は leaf から外した（#220）", () => {
    expect(getNoteArticle(LEAF_CREATOR_ID, "maimai-2020-02-screenshot")).toBeDefined();
    expect(getNoteArticle(LEAF_CREATOR_ID, "maimai-2019-08-bow-build")).toBeUndefined();
  });

  it("段階5: 古いIDと完全一致する Discord ユーザーがオフラインでおり、#パーティー募集 に過去投稿（mhc-lfg-0901..0904）がある", () => {
    const old = users.find((user) => user.handle === OLD_DISCORD_ID);
    expect(old, OLD_DISCORD_ID).toBeDefined();
    expect(old?.status).toBe("offline");

    const mhcLfg = channelMessages["mhc-lfg"] ?? [];
    const oldPosts = mhcLfg.filter((message) =>
      ["mhc-lfg-0901", "mhc-lfg-0902", "mhc-lfg-0903", "mhc-lfg-0904"].includes(message.id),
    );
    expect(oldPosts).toHaveLength(4);
    expect(oldPosts.filter((message) => message.authorId === "denden")).toHaveLength(3);
    // 旧IDは移行記事の画像から拾い、Discordのアカウントと照合する。
    expect(oldPosts.map((message) => message.body).join("\n")).not.toContain(old?.handle);
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

  it("段階7・8: コンテスト名が造語「蒼穹フォトアワード 2020」で、記事 e20181117 と sitemap に結果ページがある", () => {
    expect(PHOTO_CONTEST_NAME).toBe("蒼穹フォトアワード 2020");
    const entry = getEntry("denden0102", "e20181117");
    expect(entry).toBeDefined();
    const bodyText = (entry?.body ?? [])
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");
    expect(bodyText).toContain(PHOTO_CONTEST_NAME);
    const urls = sitemap().map((item) => item.url);
    expect(urls.some((url) => url.endsWith(PHOTO_CONTEST_RESULT_PATH))).toBe(true);
  });

  it("段階9・11: Discord の静的な会話ログには、本名検索の助言や結末が先出しされない", () => {
    expect(
      allDiscordMessages.some(
        (message) =>
          message.body.includes("本名で検索") || message.body.includes("住所を特定しました"),
      ),
    ).toBe(false);
  });

  it("段階9: ch5-kai-contact でカイが「本名で検索」を助言し、s09-kai-contact を立てる", () => {
    const beat = beats.find((candidate) => candidate.id === "ch5-kai-contact");
    expect(beat).toBeDefined();
    expect(beat?.sets).toContain("s09-kai-contact");
    expect(beat?.place).toBe("discord:dm-kai");
    const hasHintInScript = textsOf(beat?.script ?? []).some(
      (line) => line.from === "kai" && line.text.includes("本名で検索"),
    );
    const hasHintInChats = chatsOf("ch5-kai-contact", beat?.script ?? []).some(
      (message) => message.from === "kai" && message.text.includes("本名で検索"),
    );
    expect(hasHintInScript).toBe(false);
    expect(hasHintInChats).toBe(true);
  });

  it("段階10: talkup に u40（yui__photo）と入学式の投稿（fbp-201）があり、通常フィードから隠れ、本名検索で見つかる", () => {
    const targetUser = getTalkupUserByHandle("yui__photo");
    expect(targetUser?.id).toBe("u40");
    const entrancePost = getTalkupPostById("fbp-201");
    expect(entrancePost?.authorId).toBe("u40");
    expect(entrancePost?.body).toContain("入学式");
    expect(filterFeedPosts(listTalkupPosts()).some((post) => post.authorId === "u40")).toBe(false);
    const found = searchFacebook(targetUser?.displayName ?? "");
    expect(found.users.map((user) => user.id)).toContain("u40");
    expect(found.posts.map((post) => post.id)).toContain("fbp-201");
  });

  it("段階11: ch5-talkup の「現地へ向かう」で s11-address が立ち、ch6-bad-end へ進む", () => {
    const talkupBeat = beats.find((candidate) => candidate.id === "ch5-talkup");
    const visitChoice = talkupBeat?.choices?.find((choice) => choice.id === "visit-house");
    expect(visitChoice?.label).toBe("現地へ向かう");
    expect(visitChoice?.sets).toContain("s11-address");

    const badEnd = beats.find((candidate) => candidate.id === "ch6-bad-end");
    expect(badEnd?.when).toContain("s11-address");
    expect(badEnd?.after).toContain("ch5-talkup");
  });

  it("True End 導線: 4つの手がかり実物とシナリオ最終3場面が整合している", () => {
    // 1. Discord dm-kai に「でんちゃん」の助言メッセージが存在する
    const advice = (dmMessages["dm-kai"] ?? []).find(
      (message) => message.id === KAI_NICKNAME_ADVICE_MESSAGE_ID,
    );
    expect(advice?.authorId).toBe("kai");
    expect(advice?.body).toContain("でんちゃん");

    // 2. Discord mhc には初期状態で kai が居ない
    expect(getGuild("mhc")?.memberIds).not.toContain("kai");

    // 3. Talkup で u40 は5/5を相互フォローし、フォロワーのうち χ（imperial_chi）だけ未フォローバック
    const u40 = getTalkupUserByHandle("yui__photo");
    expect(u40?.id).toBe("u40");
    const u40Following = listTalkupFollowing("u40");
    const u40Followers = listTalkupFollowers("u40");
    expect(u40Following).toHaveLength(5);
    expect(u40Followers).toHaveLength(6);
    const followingIds = new Set(u40Following.map((u) => u.id));
    const unreciprocated = u40Followers.filter((u) => !followingIds.has(u.id));
    expect(unreciprocated.map((u) => [u.id, u.handle])).toEqual([
      [KAI_TALKUP_USER_ID, KAI_TALKUP_HANDLE],
    ]);

    // 4. Twixer @kanon__dayo にストーカー被害示唆の投稿が存在する
    const stalkerPost = getTwitterPost(KANON_STALKER_POST_ID);
    expect(stalkerPost?.authorId).toBe("tw-kanon");
    expect(stalkerPost?.body).toContain("ストーカー");

    // 5. True End の3場面に禁止語・todo・maimai の「でんちゃん」発言が無い
    for (const id of ["ch6-confront-kai", "ch6-maimai-reply", "ch6-true-end"]) {
      const beat = beats.find((candidate) => candidate.id === id);
      expect(beat, id).toBeDefined();
      if (!beat) continue;
      const lines = [
        ...textsOf(beat.script),
        ...chatsOf(beat.id, beat.script).map((m) => ({ from: m.from, text: m.text })),
      ];
      for (const line of lines) {
        for (const word of FORBIDDEN_WORDS) {
          expect(line.text).not.toContain(word);
        }
        if ("todo" in line) {
          expect(line.todo).toBeUndefined();
        }
        if (line.from === "maimai") {
          expect(line.text).not.toContain("でんちゃん");
        }
      }
    }
  });
});

describe("物語のチャットの流し先（lib/story/places.ts）", () => {
  it("MaiMai との DM の URL が Discord のデータと一致する", () => {
    expect(getDMThread("dm-maimai")?.urlId).toBe(MAIMAI_DM_URL_ID);
  });

  it("χ（カイ）との DM の URL が Discord のデータと一致し、チャット定義がある", () => {
    expect(getDMThread("dm-kai")?.urlId).toBe(KAI_DM_URL_ID);
    expect(PLACES["discord:dm-kai"].href).toContain(KAI_DM_URL_ID);
    expect(CHAT_CHANNELS["discord:dm-kai"].place).toBe("discord:dm-kai");
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
