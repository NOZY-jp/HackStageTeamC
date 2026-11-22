import { describe, expect, it } from "vitest";
import { GAME_NOW } from "@/lib/platform/game-time";
import { channelMessages, dmMessages } from "./data/messages";
import { listChannels, listDMMessages, listDMThreads, listGuilds, listMessages } from "./index";
import {
  NATURALNESS_LIMITS as N,
  TEMPERATURE_LIMITS as T,
  VOLUME_LIMITS as V,
} from "./test-thresholds";
import type { Message } from "./types";

type ToneForm = "softEmoji" | "keigo" | "tameguchi";

const GRAT_BASE =
  /ありがと|あざ|サンキュ|さんきゅ|助か|了解|りょ(?:うかい)?(?:\s|$|！|!)|おけ|\bok\b|わかりまし|わかった|おつかれ|お疲れ|すみません|ごめん|おやすみ|お願い|よろしく|大丈夫|いいよ|もちろん|待って/i;
const SOFT_MARKER =
  /[😊😂👍🙏💕✨🎉🙌]|(?<![0-9一二三四五六七八九十時分日月])[〜～]|(?:ありがと|おやすみ|おつかれ|ごめん|助かる|よろしく|いいよ|待ってる|直す)ね(?:\s|$|[、,！!。])/u;
const KEIGO_GRAT =
  /ありがとうございま|ありがとうございました|助かります|助かりました|了解です|わかりました|おつかれさまです|おつかれさまでした|お疲れ様です|お疲れ様でした|承知しました|お願いします|よろしくお願いします|すみません|大丈夫です|待ってます|もちろん、|\bokです/i;
const TAME_GRAT =
  /ありがと(?![う]*ございま)|サンキュー|さんきゅ|あざ(?:す|ーっす)|助かる(?!ま)|助かった|了解(?!です)|りょ(?:うかい)?(?:\s|$|！|!)|おけ|\bok\b(?!です)|おつかれ(?!さま)|ごめん(?!なさい)|よろしく(?!お願)|わかった(?!り)|大丈夫(?!です)|いいよ(?!ね)|待ってる(?!ね)/i;

/** 感謝・相槌・挨拶の語形を 恋人寄り(softEmoji) / 敬語(keigo) / タメ口(tameguchi) に分類する。 */
function classifyReplyTone(body: string): ToneForm | null {
  if (!GRAT_BASE.test(body)) return null;
  if (SOFT_MARKER.test(body)) return "softEmoji";
  if (KEIGO_GRAT.test(body)) return "keigo";
  if (TAME_GRAT.test(body)) return "tameguchi";
  return null;
}

const POLITE_ENDING =
  /(?:です|ます|ました|ません|でした|ください|ございます|でしょうか)[。！!？?\s]*$/;

/** 文末・表現全体で 柔らかめ(softEmoji) / 敬語(keigo) / 常体(tameguchi) に分類する。 */
function classifyMessageStyle(body: string): ToneForm {
  if (SOFT_MARKER.test(body)) return "softEmoji";
  if (POLITE_ENDING.test(body)) return "keigo";
  return "tameguchi";
}

/** 分割表のピアソン χ² 統計量と最小期待度数を計算する。 */
function chiSquared(matrix: number[][]): { stat: number; minExpected: number } {
  const rowSums = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const colSums = matrix[0].map((_, col) => matrix.reduce((sum, row) => sum + row[col], 0));
  const total = rowSums.reduce((sum, value) => sum + value, 0);
  let stat = 0;
  let minExpected = Number.POSITIVE_INFINITY;
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = 0; j < matrix[i].length; j += 1) {
      const expected = (rowSums[i] * colSums[j]) / Math.max(1, total);
      minExpected = Math.min(minExpected, expected);
      if (expected > 0) {
        stat += (matrix[i][j] - expected) ** 2 / expected;
      }
    }
  }
  return { stat, minExpected };
}

const STOP_WORDS = new Set([
  "です",
  "ます",
  "これ",
  "それ",
  "あれ",
  "今日",
  "明日",
  "昨日",
  "自分",
  "相手",
  "こと",
  "もの",
  "よう",
  "ところ",
  "ちゃん",
  "さん",
  "けど",
  "から",
  "まで",
  "じゃ",
  "そう",
  "はい",
  "うん",
  "いい",
  "ない",
  "ある",
  "する",
  "なる",
  "いる",
  "できる",
  "思う",
  "大丈夫",
  "了解",
  "お願い",
  "すみません",
  "ありがとう",
  "ございます",
  "わかりました",
  "おつかれ",
  "おやすみ",
  "おはよう",
  "久しぶり",
  "連絡",
  "本当",
  "ほんと",
  "時間",
]);

/** 1文字の漢字だけで表せる具象名詞（2字以上の熟語は [一-龠]{2,} 側で拾うため含めない）。 */
const SINGLE_CONCRETE_NOUN = new Set([
  ..."海空髪服傘飯鍵猫犬雪雨声駅本車靴袋壁橋道薬罠弓笛盾砲玉爪毛色絵音話鍋蓋店花桜蚊森山星風雲月木火水土石紙窓机床門坂船鳥魚虫草夢顔手足指目口耳鼻歯首肩腰胸心歌嘘宿箱組班席列式図表枠線角印影光",
]);

const GENERIC_STEM_KANJI =
  "何誰私僕俺一二三四五六七八九十今先前後上下中大小多少早遅長短高安新古良悪";

/** 発話から具象名詞・ドメイン語・動詞/形容詞の漢字語幹を取り出す。 */
function extractContentTerms(body: string): { nouns: string[]; verbStems: string[] } {
  const multi =
    body.match(/[一-龠]{2,}|[ァ-ヶー]{2,}|[A-Za-z]{2,}|\d+[時分日枚本個回戦限号館]/g) ?? [];
  const singleNouns: string[] = [];
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (!SINGLE_CONCRETE_NOUN.has(ch)) continue;
    const prevKanji = i > 0 && /[一-龠]/.test(body[i - 1]);
    const nextKanji = i + 1 < body.length && /[一-龠]/.test(body[i + 1]);
    if (!prevKanji && !nextKanji) singleNouns.push(ch);
  }
  const verbStems: string[] = [];
  for (const match of body.matchAll(/([一-龠])[ぁ-ん]/g)) {
    if (!GENERIC_STEM_KANJI.includes(match[1])) {
      verbStems.push(match[1]);
    }
  }
  return {
    nouns: [...new Set([...multi, ...singleNouns].filter((word) => !STOP_WORDS.has(word)))],
    verbStems: [...new Set(verbStems)],
  };
}

/**
 * 発話中に語が「その語として」現れるか。
 * 1字の漢字名詞は「猫」が「猫背」に含まれるような別語との部分一致を数えない
 * （前後が漢字なら同じ語の一部とみなす）。
 */
function termOccursIn(body: string, term: string): boolean {
  if (term.length !== 1 || !/[一-龠]/.test(term)) return body.includes(term);
  let index = body.indexOf(term);
  while (index !== -1) {
    const left = index > 0 ? body[index - 1] : "";
    const right = index + 1 < body.length ? body[index + 1] : "";
    if (!/[一-龠]/.test(left) && !/[一-龠]/.test(right)) return true;
    index = body.indexOf(term, index + 1);
  }
  return false;
}

/** 2つの連続発話が名詞・ドメイン語または動詞語幹を引き継いでいるか判定する。 */
function echoesPrecedingTurn(prevBody: string, currBody: string): boolean {
  const prev = extractContentTerms(prevBody);
  const curr = extractContentTerms(currBody);
  return (
    prev.nouns.some((term) => termOccursIn(currBody, term)) ||
    curr.nouns.some((term) => termOccursIn(prevBody, term)) ||
    prev.verbStems.some((stem) => curr.verbStems.includes(stem))
  );
}

/** システム行・無言画像投稿を除いたメッセージ列を burstWindowMinutes で分割する。 */
function spokenBurstsOf(list: Message[]): Message[][] {
  const spoken = list.filter(
    (message) => message.system !== true && message.body.trim().length > 0,
  );
  const bursts: Message[][] = [];
  for (const message of spoken) {
    const current = bursts.at(-1);
    const previous = current?.at(-1);
    const gap = previous
      ? (Date.parse(message.sentAt) - Date.parse(previous.sentAt)) / 60_000
      : Number.POSITIVE_INFINITY;
    if (current && gap <= N.burstWindowMinutes) {
      current.push(message);
    } else {
      bursts.push([message]);
    }
  }
  return bursts;
}

function topicContinuityStats(lists: Message[][]): {
  switches: number;
  echoed: number;
  rate: number;
} {
  let switches = 0;
  let echoed = 0;
  for (const list of lists) {
    for (const burst of spokenBurstsOf(list)) {
      for (let i = 1; i < burst.length; i += 1) {
        if (burst[i].authorId === burst[i - 1].authorId) continue;
        switches += 1;
        if (echoesPrecedingTurn(burst[i - 1].body, burst[i].body)) {
          echoed += 1;
        }
      }
    }
  }
  return { switches, echoed, rate: switches > 0 ? echoed / switches : 0 };
}

const quantile = (sorted: number[], p: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;

const allContainers: Record<string, Message[]> = {
  ...dmMessages,
  ...channelMessages,
};

describe("Round 6 精度指標（#252）", () => {
  describe("① 返信の温度差（関係性×語形のクロス集計）", () => {
    const countForms = (
      channelIds: string[],
      filterFn: (message: Message) => boolean = () => true,
      classifier: (body: string) => ToneForm | null = classifyReplyTone,
    ) => {
      const counts: Record<ToneForm, number> = { softEmoji: 0, keigo: 0, tameguchi: 0 };
      for (const id of channelIds) {
        for (const message of allContainers[id] ?? []) {
          if (message.system === true || !filterFn(message)) continue;
          const form = classifier(message.body);
          if (form) counts[form] += 1;
        }
      }
      return counts;
    };

    const share = (counts: Record<ToneForm, number>, form: ToneForm) => {
      const total = counts.softEmoji + counts.keigo + counts.tameguchi;
      return total > 0 ? counts[form] / total : 0;
    };

    const univFormalIds = new Set([
      "hal",
      "hayashi",
      "hasegawa",
      "ishikawa",
      "hashimoto",
      "mori",
      "ueda",
      "kondo",
      "yoshida",
      "maeda",
    ]);
    const univChannelIds = [
      "univ-contact",
      "univ-class",
      "univ-chat",
      "univ-job",
      "univ-report",
      "univ-any",
    ];
    const mhcChannelIds = [
      "mhc-lfg",
      "mhc-chat",
      "mhc-questions",
      "mhc-clips",
      "mhc-notice",
      "mhc-gear",
      "mhc-intro",
    ];
    const mhcRegularIds = new Set(["gunlance", "mina", "jijii"]);
    const friendIds = [
      "dm-taku",
      "dm-jun",
      "dm-miyu",
      "dm-yama",
      "dm-gunlance",
      "friend-chat",
      "friend-plan",
      "friend-memory",
    ];

    it("恋人・敬語関係（先輩後輩/カイ/学科敬語組）・リア友＆mhc常連で応答語形と文体が分離する", () => {
      const lover = countForms(["dm-maimai"], (message) => message.authorId === "maimai");
      const academicDms = countForms(["dm-ootsuka", "dm-hayashi", "dm-kai"]);
      const academicUniv = countForms(univChannelIds, (message) =>
        univFormalIds.has(message.authorId),
      );
      const academic: Record<ToneForm, number> = {
        softEmoji: academicDms.softEmoji + academicUniv.softEmoji,
        keigo: academicDms.keigo + academicUniv.keigo,
        tameguchi: academicDms.tameguchi + academicUniv.tameguchi,
      };
      const friendsOnly = countForms(friendIds);
      const mhcRegulars = countForms(mhcChannelIds, (message) =>
        mhcRegularIds.has(message.authorId),
      );
      const regularCombined: Record<ToneForm, number> = {
        softEmoji: friendsOnly.softEmoji + mhcRegulars.softEmoji,
        keigo: friendsOnly.keigo + mhcRegulars.keigo,
        tameguchi: friendsOnly.tameguchi + mhcRegulars.tameguchi,
      };

      const { stat, minExpected } = chiSquared([
        [lover.softEmoji, lover.keigo, lover.tameguchi],
        [academic.softEmoji, academic.keigo, academic.tameguchi],
        [regularCombined.softEmoji, regularCombined.keigo, regularCombined.tameguchi],
      ]);

      expect(minExpected).toBeGreaterThanOrEqual(T.tone.minExpectedCount);
      expect(stat).toBeGreaterThanOrEqual(T.tone.chi2Min);

      // 各関係で支配的な語形が入れ替わらないことを保証する
      expect(lover.softEmoji).toBeGreaterThanOrEqual(T.tone.loverSoftCountMin);
      expect(share(lover, "softEmoji")).toBeGreaterThan(share(academic, "softEmoji"));
      expect(share(lover, "softEmoji")).toBeGreaterThan(share(regularCombined, "softEmoji"));

      expect(share(academic, "keigo")).toBeGreaterThanOrEqual(T.tone.academicKeigoShareMin);
      expect(academic.keigo).toBeGreaterThan(academic.tameguchi);

      expect(share(regularCombined, "tameguchi")).toBeGreaterThanOrEqual(
        T.tone.regularTameShareMin,
      );
      expect(share(friendsOnly, "tameguchi")).toBeGreaterThanOrEqual(
        T.tone.friendsOnlyTameShareMin,
      );
      expect(regularCombined.tameguchi).toBeGreaterThan(regularCombined.keigo);

      // 発話全体の文末・文体クロス集計でも同じ関係性の分離が成立する
      const styleLover = countForms(
        ["dm-maimai"],
        (message) => message.authorId === "maimai",
        classifyMessageStyle,
      );
      const styleAcadDms = countForms(
        ["dm-ootsuka", "dm-hayashi", "dm-kai"],
        () => true,
        classifyMessageStyle,
      );
      const styleAcadUniv = countForms(
        univChannelIds,
        (message) => univFormalIds.has(message.authorId),
        classifyMessageStyle,
      );
      const styleAcad: Record<ToneForm, number> = {
        softEmoji: styleAcadDms.softEmoji + styleAcadUniv.softEmoji,
        keigo: styleAcadDms.keigo + styleAcadUniv.keigo,
        tameguchi: styleAcadDms.tameguchi + styleAcadUniv.tameguchi,
      };
      const styleFriends = countForms(friendIds, () => true, classifyMessageStyle);
      const styleMhc = countForms(
        mhcChannelIds,
        (message) => mhcRegularIds.has(message.authorId),
        classifyMessageStyle,
      );
      const styleRegular: Record<ToneForm, number> = {
        softEmoji: styleFriends.softEmoji + styleMhc.softEmoji,
        keigo: styleFriends.keigo + styleMhc.keigo,
        tameguchi: styleFriends.tameguchi + styleMhc.tameguchi,
      };
      const styleChi = chiSquared([
        [styleLover.softEmoji, styleLover.keigo, styleLover.tameguchi],
        [styleAcad.softEmoji, styleAcad.keigo, styleAcad.tameguchi],
        [styleRegular.softEmoji, styleRegular.keigo, styleRegular.tameguchi],
      ]);
      expect(styleChi.stat).toBeGreaterThanOrEqual(T.tone.styleChi2Min);
      expect(share(styleAcad, "keigo")).toBeGreaterThan(share(styleRegular, "keigo"));
      expect(share(styleRegular, "keigo")).toBeGreaterThan(share(styleLover, "keigo"));
      expect(share(styleLover, "softEmoji")).toBeGreaterThan(share(styleRegular, "softEmoji"));
    });

    it("反例検査: 同じ分類器でも語形・分布を崩すと分離しない", () => {
      expect(classifyReplyTone("ありがと😊")).toBe("softEmoji");
      expect(classifyReplyTone("ありがとうございます")).toBe("keigo");
      expect(classifyReplyTone("OKです")).toBe("keigo");
      expect(classifyReplyTone("サンキュー")).toBe("tameguchi");
      expect(classifyReplyTone("いいよ")).toBe("tameguchi");
      expect(classifyReplyTone("お願いします！ざっくり14時〜17時で！")).toBe("keigo");
      const uniform = chiSquared([
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
      ]);
      expect(uniform.stat).toBe(0);
    });
  });

  describe("② 話題の引き継ぎ（直前発話の名詞・動詞のエコー率）", () => {
    it("DM グループごとの話題引き継ぎ率が下限を満たす", () => {
      const dmGroups = {
        lover: ["dm-maimai"],
        kai: ["dm-kai"],
        academicDm: ["dm-ootsuka", "dm-yama", "dm-hayashi"],
        friendsDm: ["dm-taku", "dm-jun", "dm-miyu", "dm-gunlance"],
      } as const;

      for (const [group, ids] of Object.entries(dmGroups) as [
        keyof typeof T.continuity.dmGroupMin,
        readonly string[],
      ][]) {
        const stats = topicContinuityStats(ids.map((id) => dmMessages[id] ?? []));
        expect(stats.switches, group).toBeGreaterThan(15);
        expect(stats.rate, `${group}: ${stats.echoed}/${stats.switches}`).toBeGreaterThanOrEqual(
          T.continuity.dmGroupMin[group],
        );
      }
    });

    it("サーバーのテキストチャンネルごとの話題引き継ぎ率が下限を満たす", () => {
      const textChannels = listGuilds().flatMap((guild) =>
        listChannels(guild.id).filter((channel) => channel.kind === "text"),
      );
      expect(textChannels).toHaveLength(16);
      for (const channel of textChannels) {
        const min =
          T.continuity.serverChannelMin[channel.id as keyof typeof T.continuity.serverChannelMin];
        expect(min, `threshold missing: ${channel.id}`).toBeDefined();
        const stats = topicContinuityStats([
          listMessages({ channelId: channel.id, limit: 5000 }).messages,
        ]);
        expect(stats.switches, channel.id).toBeGreaterThan(15);
        expect(
          stats.rate,
          `${channel.id}: ${stats.echoed}/${stats.switches}`,
        ).toBeGreaterThanOrEqual(min);
      }
    });

    it("反例検査: 無関係な短い相槌だけでは話題の引き継ぎにならない", () => {
      expect(echoesPrecedingTurn("今日すごく暑いですね", "了解です")).toBe(false);
      expect(echoesPrecedingTurn("ESの添削をお願いします", "修正したES送ります")).toBe(true);
      expect(echoesPrecedingTurn("一次、通った？", "一次通りました")).toBe(true);
      // 同じ字を含む別の語（猫 / 猫背）や、1字漢字の部分一致は引き継ぎに数えない
      expect(echoesPrecedingTurn("猫が寝ている", "新しい猫背矯正の広告を見た")).toBe(false);
      expect(echoesPrecedingTurn("犬を散歩した", "犬種の話になった")).toBe(false);
      expect(echoesPrecedingTurn("猫が寝ている", "猫が起きた")).toBe(true);
    });
  });

  describe("③ 未読の現実味（GAME_NOW 基準・自動導出維持）", () => {
    it("未読スレッドは2〜4本で、24時間以上放置された未読を1本以上含む", () => {
      const threads = listDMThreads();
      const unreadThreads = threads.filter((thread) => (thread.unreadCount ?? 0) > 0);
      expect(unreadThreads.length).toBeGreaterThanOrEqual(T.unread.threadsMin);
      expect(unreadThreads.length).toBeLessThanOrEqual(T.unread.threadsMax);

      const nowMs = Date.parse(GAME_NOW);
      const staleUnread = unreadThreads.filter(
        (thread) => nowMs - Date.parse(thread.lastMessageAt) >= T.unread.staleHoursMin * 3_600_000,
      );
      expect(staleUnread.length).toBeGreaterThanOrEqual(T.unread.staleThreadsMin);

      // rhythm.test.ts と同じ2本の未読条件（1〜2通）も壊れていない
      for (const threadId of ["dm-ootsuka", "dm-hayashi"]) {
        const thread = unreadThreads.find((candidate) => candidate.id === threadId);
        expect(thread?.unreadCount, threadId).toBeGreaterThanOrEqual(1);
        expect(thread?.unreadCount, threadId).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("④ 通話の文脈（dm-maimai 22通話・不在6件）", () => {
    const PRE_CALL_INVITE =
      /電話|通話|声聞きたい|声だけ聞きたい|話せますか|話したい|かけます|かけるよ|つなご/;
    const POST_CALL_IMPRESSION =
      /話[すせし]|喋[っりる]|声|長電話|電話|通話|おつかれ|楽しか|安心|ありがと|聞け|聞こえ|落ち着|眠く|切れ|震えて/;
    // 謝罪・言い訳だけでは折り返しとみなさない。かけ直しの実行か申し出を要求する。
    const MISSED_CALLBACK =
      /かけ直|かけなお|電話し直|つなぎ直|折り返|今からかけ|すぐかけ|あとでかけ|後でかけ|またかけ|明日かけ/;

    it("通話前2通以内の誘い・通話後2通以内の感想・不在着信100%折り返しを満たす", () => {
      const messages = listDMMessages({ threadId: "dm-maimai", limit: 6000 }).messages;
      let totalCalls = 0;
      let preInviteOk = 0;
      let hangupCalls = 0;
      let postImpressionOk = 0;
      let missedCalls = 0;
      let missedCallbackOk = 0;

      for (let i = 0; i < messages.length; i += 1) {
        const start = messages[i];
        if (start.system !== true || !start.body.includes("通話を開始しました")) continue;
        totalCalls += 1;

        const endIdx = messages.findIndex(
          (candidate, index) =>
            index > i &&
            candidate.system === true &&
            (candidate.body.includes("通話を終了しました") ||
              candidate.body.includes("応答がありませんでした")),
        );
        expect(endIdx, start.id).toBe(i + 1);
        const end = messages[endIdx];

        const preNonSystem = messages
          .slice(0, i)
          .filter((message) => message.system !== true)
          .slice(-2);
        if (
          preNonSystem.some(
            (message) =>
              PRE_CALL_INVITE.test(message.body) &&
              Date.parse(start.sentAt) - Date.parse(message.sentAt) <= 3_600_000,
          )
        ) {
          preInviteOk += 1;
        }

        const postNonSystem = messages
          .slice(endIdx + 1)
          .filter((message) => message.system !== true)
          .slice(0, 2);

        if (end.body.includes("応答がありませんでした")) {
          missedCalls += 1;
          if (
            postNonSystem.some(
              (message) =>
                MISSED_CALLBACK.test(message.body) &&
                Date.parse(message.sentAt) - Date.parse(end.sentAt) <= 24 * 3_600_000,
            )
          ) {
            missedCallbackOk += 1;
          }
        } else {
          hangupCalls += 1;
          if (
            postNonSystem.some(
              (message) =>
                POST_CALL_IMPRESSION.test(message.body) &&
                Date.parse(message.sentAt) - Date.parse(end.sentAt) <= 3_600_000,
            )
          ) {
            postImpressionOk += 1;
          }
        }
      }

      expect(totalCalls).toBe(V.dmCalls.total);
      expect(missedCalls).toBe(V.dmCalls.missed);
      expect(preInviteOk / totalCalls).toBeGreaterThanOrEqual(T.callContext.preInviteRateMin);
      expect(postImpressionOk / hangupCalls).toBeGreaterThanOrEqual(
        T.callContext.postImpressionRateMin,
      );
      expect(missedCallbackOk / missedCalls).toBeGreaterThanOrEqual(
        T.callContext.missedCallbackRateMin,
      );
      // 反例: 謝罪だけ・「また今度」だけでは折り返しにならない、無関係な一文は通話感想にならない
      expect(MISSED_CALLBACK.test("ごめん、ドライヤーしてて着信気づかなかった〜")).toBe(false);
      expect(MISSED_CALLBACK.test("ごめん、寝てた")).toBe(false);
      expect(MISSED_CALLBACK.test("大丈夫です。また今度")).toBe(false);
      expect(MISSED_CALLBACK.test("ごめん、寝てた。今からかけ直してもいい？")).toBe(true);
      expect(POST_CALL_IMPRESSION.test("明日は9時から講義です")).toBe(false);
      expect(POST_CALL_IMPRESSION.test("気づいたら一時間ちかく喋ってたね")).toBe(true);
    });
  });

  describe("⑤ 会話の長さの分布（バースト通数の中央値・P90）", () => {
    it("スレッド種別ごとに中央値・P90が範囲内に収まり、単調な長さに偏らない", () => {
      const serverTextIds = listGuilds().flatMap((guild) =>
        listChannels(guild.id)
          .filter((channel) => channel.kind === "text")
          .map((channel) => channel.id),
      );
      const categories: Record<keyof typeof T.burstDistribution, string[]> = {
        lover: ["dm-maimai"],
        kai: ["dm-kai"],
        friendsUnivDm: [
          "dm-taku",
          "dm-jun",
          "dm-miyu",
          "dm-yama",
          "dm-ootsuka",
          "dm-hayashi",
          "dm-gunlance",
        ],
        serverChannels: serverTextIds,
      };

      for (const [category, ids] of Object.entries(categories) as [
        keyof typeof T.burstDistribution,
        string[],
      ][]) {
        const lengths = ids
          .flatMap((id) => spokenBurstsOf(allContainers[id] ?? []).map((burst) => burst.length))
          .sort((a, b) => a - b);
        const median = quantile(lengths, 0.5);
        const p90 = quantile(lengths, 0.9);
        const bounds = T.burstDistribution[category];

        expect(median, `${category} median`).toBeGreaterThanOrEqual(bounds.median.min);
        expect(median, `${category} median`).toBeLessThanOrEqual(bounds.median.max);
        expect(p90, `${category} p90`).toBeGreaterThanOrEqual(bounds.p90.min);
        expect(p90, `${category} p90`).toBeLessThanOrEqual(bounds.p90.max);
        expect(p90, `${category} spread`).toBeGreaterThan(median);
        expect(lengths[0], `${category} min`).toBeLessThan(median);
      }
    });
  });
});
