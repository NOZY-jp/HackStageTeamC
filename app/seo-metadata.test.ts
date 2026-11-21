import { describe, expect, it } from "vitest";
import { blogPath, entryPath, listAllEntries, listBlogs } from "@/lib/blog-like";
import { creatorHref, listArticles, listCreators, SERVICE_NAME } from "@/lib/note-like";
import { entryDescription, summarize } from "@/lib/seo/description";
import { canonicalUrl, SITE_URL } from "@/lib/seo/site";
import { generateMetadata as entryMetadata } from "./(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import { generateMetadata as blogMetadata } from "./(blog-like)/pochiblo/[blogId]/page";
import { generateMetadata as noteMetadata } from "./(note-like)/note/[creatorId]/n/[noteId]/page";
import { generateMetadata as creatorMetadata } from "./(note-like)/note/[creatorId]/page";
import { metadata as noteTopMetadata } from "./(note-like)/note/page";

const BLOG = listBlogs()[0];
const ENTRY = listAllEntries(BLOG.id)[0];
const CREATOR = listCreators()[0];
const params = <T extends object>(value: T) => Promise.resolve(value);
const emptySearch = Promise.resolve({});

describe("ページ metadata（#77 第2・3段階）", () => {
  it("canonicalUrl は本番URLの絶対URLを作る", () => {
    expect(canonicalUrl("/note")).toBe(`${SITE_URL}/note`);
    expect(canonicalUrl("/pochiblo/denden0102")).toBe(`${SITE_URL}/pochiblo/denden0102`);
  });

  it("ブログの記事一覧は ブログ名・説明・canonical を返す", async () => {
    const meta = await blogMetadata({
      params: params({ blogId: BLOG.id }),
      searchParams: emptySearch,
    });
    expect(meta.title).toEqual({ absolute: BLOG.title });
    expect(meta.description).toBe(BLOG.description);
    expect(meta.alternates?.canonical).toBe(canonicalUrl(blogPath(BLOG.id)));
  });

  it("ブログ記事は 記事タイトル・本文の要約・canonical を返す", async () => {
    const meta = await entryMetadata({
      params: params({ blogId: BLOG.id, entryId: ENTRY.id }),
      searchParams: emptySearch,
    });
    expect(meta.title).toEqual({ absolute: ENTRY.title });
    expect(meta.alternates?.canonical).toBe(canonicalUrl(entryPath(BLOG.id, ENTRY.id)));
    expect(typeof meta.description).toBe("string");
    expect(meta.description?.length).toBeLessThanOrEqual(150);
    // 本文（段落・見出し）の冒頭が要約に入っている
    const lead = ENTRY.body.find((block) => block.kind === "paragraph");
    if (lead && lead.kind === "paragraph") {
      expect(meta.description).toBe(entryDescription(ENTRY.body));
      expect(meta.description?.startsWith(lead.text.slice(0, 10))).toBe(true);
    }
  });

  it("存在しないブログ・記事は metadata を空で返す（404 のまま）", async () => {
    expect(
      await blogMetadata({ params: params({ blogId: "nope" }), searchParams: emptySearch }),
    ).toEqual({});
    expect(
      await entryMetadata({
        params: params({ blogId: BLOG.id, entryId: "nope" }),
        searchParams: emptySearch,
      }),
    ).toEqual({});
  });

  it("leaf の記事一覧は タイトル・説明・canonical を返す", () => {
    expect(noteTopMetadata.title).toEqual({ absolute: `新着記事｜${SERVICE_NAME}` });
    expect(typeof noteTopMetadata.description).toBe("string");
    expect(noteTopMetadata.alternates?.canonical).toBe(canonicalUrl("/note"));
  });

  it("leaf の書き手は 表示名・自己紹介・canonical を返す", async () => {
    const meta = await creatorMetadata({
      params: params({ creatorId: CREATOR.id }),
      searchParams: emptySearch,
    });
    expect(meta.title).toBe(CREATOR.displayName);
    expect(meta.description).toBe(CREATOR.bio);
    expect(meta.alternates?.canonical).toBe(canonicalUrl(creatorHref(CREATOR.id)));
  });

  it("leaf の記事は タイトル・要約・canonical を返す（存在しない記事でも落ちない）", async () => {
    // 存在しない記事（generateStaticParams の仮パス相当）は metadata を返さない
    const empty = await noteMetadata({
      params: params({ creatorId: "_", noteId: "_" }),
      searchParams: emptySearch,
    });
    expect(empty).toEqual({});

    const article = listArticles()[0];
    if (!article) throw new Error("記事がない");
    const meta = await noteMetadata({
      params: params({ creatorId: article.creatorId, noteId: article.id }),
      searchParams: emptySearch,
    });
    expect(meta.title).toBe(article.title);
    expect(meta.description).toBe(article.excerpt);
    expect(meta.alternates?.canonical).toBe(
      canonicalUrl(`/note/${article.creatorId}/n/${article.id}`),
    );
  });
});

describe("本文の要約（#77）", () => {
  it("空白を詰め、150字を超えたら末尾を省略する", () => {
    expect(summarize("  一行目\n二行目  ")).toBe("一行目 二行目");
    const long = "あ".repeat(200);
    const summary = summarize(long);
    expect(summary).toHaveLength(150);
    expect(summary.endsWith("…")).toBe(true);
    expect(summarize("短い")).toBe("短い");
  });

  it("記事の本文は段落と見出しだけを連結する", () => {
    const text = entryDescription([
      { kind: "heading", text: "見出し" },
      { kind: "paragraph", text: "本文です。" },
      { kind: "image", src: "/a.png", alt: "画像", width: 1, height: 1 },
    ]);
    expect(text).toBe("見出し 本文です。");
  });
});
