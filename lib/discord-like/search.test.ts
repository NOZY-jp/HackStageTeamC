import { describe, expect, it } from "vitest";
import {
  listChannels,
  listDMMessages,
  listDMThreads,
  listGuilds,
  listMessages,
  loadUntil,
} from "./index";
import { buildSearchIndex, searchIndex } from "./search";
import { parseQuery } from "./search-query";

const index = buildSearchIndex();

const run = (query: string, order?: "new" | "old") => {
  const response = searchIndex(index, parseQuery(query), { order });
  if (!response.ok) {
    throw new Error(`検索に失敗: ${response.error.message}`);
  }
  return response;
};

describe("インデックス", () => {
  it("すべてのテキストチャンネルと DM を検索対象にする", () => {
    const channelIds = listGuilds()
      .flatMap((guild) => listChannels(guild.id))
      .filter((channel) => channel.kind === "text")
      .flatMap((channel) =>
        listMessages({ channelId: channel.id, limit: Infinity }).messages.map(
          (message) => message.id,
        ),
      );
    const dmIds = listDMThreads().flatMap((thread) =>
      listDMMessages({ threadId: thread.id, limit: Infinity }).messages.map(
        (message) => message.id,
      ),
    );
    const indexedIds = (mode: "channel" | "dm") =>
      index.documents
        .filter((doc) => doc.mode === mode)
        .map((doc) => doc.id)
        .sort();

    expect(indexedIds("channel")).toEqual(channelIds.sort());
    expect(indexedIds("dm")).toEqual(dmIds.sort());
  });
});

describe("フィルタの組み合わせ", () => {
  it("from:MaiMai during:2026-08 は本人の8月の発言だけを返す", () => {
    const { hits, total } = run("from:MaiMai during:2026-08");
    expect(total).toBeGreaterThan(0);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.authorName).toBe("MaiMai");
      expect(hit.sentAt.slice(0, 7)).toBe("2026-08");
    }
  });

  it("in:雑談 はそのチャンネルの発言だけを返す", () => {
    const { hits } = run("in:雑談", "new");
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.mode).toBe("channel");
      expect(hit.channelLabel).toBe("雑談");
    }
  });

  it("in: は DM の相手名でも引ける", () => {
    const { hits } = run("in:MaiMai");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.mode === "dm")).toBe(true);
  });

  it("before / after / during は日付の両端を含む", () => {
    const during = run("during:2026-04-18");
    expect(during.total).toBeGreaterThan(0);
    for (const hit of during.hits) {
      expect(hit.sentAt.slice(0, 10)).toBe("2026-04-18");
    }

    const before = run("before:2025-03-01");
    expect(before.hits.every((hit) => hit.sentAt.slice(0, 10) < "2025-03-01")).toBe(true);

    const after = run("after:2026-11-01");
    expect(after.hits.every((hit) => hit.sentAt.slice(0, 10) > "2026-11-01")).toBe(true);
  });

  it("has: は添付・リンクの種類で絞る", () => {
    const images = run("has:image");
    expect(images.total).toBeGreaterThan(0);
    // 画像だけの投稿（本文なし）もある（#131）
    expect(images.hits.some((hit) => hit.body === "")).toBe(true);

    const links = run("has:link");
    expect(links.total).toBeGreaterThan(0);
    for (const hit of links.hits) {
      expect(hit.body).toMatch(/https?:\/\//);
    }

    // 動画・ファイルの添付は #68 のデータに無い
    expect(run("has:video").total).toBe(0);
    expect(run("has:file").total).toBe(0);
  });

  it("ピン留めはデータ（Message.pinned）にだけ存在する", () => {
    const pinnedIds = index.documents
      .filter((document) => document.pinned)
      .map((document) => document.id)
      .sort();
    expect(pinnedIds).toEqual(["mhc-notice-0003", "mhc-notice-0005"]);
  });

  it("pinned: はデータのピン留めと一致する", () => {
    const pinned = run("pinned:true");
    expect(pinned.total).toBeGreaterThan(0);
    expect(pinned.hits.every((hit) => hit.pinned)).toBe(true);
    expect(pinned.hits.map((hit) => hit.id)).toContain("mhc-notice-0003");

    const others = run("pinned:false");
    expect(others.total).toBeGreaterThan(pinned.total);
    expect(others.hits.every((hit) => !hit.pinned)).toBe(true);
  });

  it("mentions: は本文の @ 表記に一致する（データには無いので0件）", () => {
    expect(run("mentions:琥珀").total).toBe(0);
  });
});

describe("フリーワードと順序", () => {
  it("複数語は AND（「攻略」「ブログ」の両方を含む発言だけ）", () => {
    const { hits, total } = run("攻略 ブログ");
    expect(total).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.body).toContain("攻略");
      expect(hit.body).toContain("ブログ");
    }
    // 順序1の会話（中3の頃の攻略ブログ）に到達できる
    expect(hits.map((hit) => hit.id)).toContain("dm-maimai-0060");
  });

  it("「note」「移行」でも過去会話に到達できる", () => {
    expect(run("note").total).toBeGreaterThan(0);
    expect(run("移行").total).toBeGreaterThan(0);
  });

  it("存在しない語は0件", () => {
    expect(run("そんな単語はない").total).toBe(0);
  });

  it("並び順を切り替えられる", () => {
    const newest = run("in:雑談", "new");
    const oldest = run("in:雑談", "old");
    expect(newest.hits[0].sentAt >= newest.hits[newest.hits.length - 1].sentAt).toBe(true);
    expect(oldest.hits[0].sentAt <= oldest.hits[oldest.hits.length - 1].sentAt).toBe(true);
    expect(oldest.hits[0].id).not.toBe(newest.hits[0].id);
  });
});

describe("旧垢と不正フィルタ", () => {
  it.each(["den", "hunter_denden", "hunter_denden324"])(
    "旧アカウントがハンドルの一部（%s）で検索結果に出ない",
    (query) => {
      const { hits, matchedUsers } = run(query);
      expect(hits.some((hit) => hit.authorId === "denden")).toBe(false);
      expect(matchedUsers.some((user) => user.id === "denden")).toBe(false);
    },
  );

  it("フリーワードでもハンドルが完全一致すれば旧アカウントが見つかる", () => {
    const { matchedUsers } = run("@HUNTER_DENDEN3243");
    expect(matchedUsers).toEqual([expect.objectContaining({ id: "denden", status: "offline" })]);
  });

  it("from: に旧ハンドルを指定すると発言と該当ユーザーが返る", () => {
    const response = run("from:hunter_denden3243");
    expect(response.hits.length).toBeGreaterThan(0);
    expect(response.matchedUsers.map((user) => user.handle)).toContain("hunter_denden3243");
  });

  it("不正なフィルタは error を返す", () => {
    const response = searchIndex(index, parseQuery("has:gif"));
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.token).toBe("has:gif");
    }
  });

  it("ヒットしたIDはジャンプ先（loadUntil）で見つかる", () => {
    const dm = run("中3", "old").hits.find((hit) => hit.mode === "dm");
    expect(dm).toBeDefined();
    expect(loadUntil({ threadId: "dm-maimai", messageId: dm?.id ?? "" }).found).toBe(true);

    const channel = run("in:雑談", "old").hits[0];
    expect(channel.mode).toBe("channel");
    expect(loadUntil({ channelId: "mhc-chat", messageId: channel.id }).found).toBe(true);
  });
});
