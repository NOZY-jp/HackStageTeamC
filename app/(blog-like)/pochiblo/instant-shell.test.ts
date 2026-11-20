import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// #82: `cacheComponents`（PPR）では、ページのトップレベルで `await params` すると
// 「`params` が <Suspense> の外で読まれている」警告（instant-shell-url-data）が出る。
// この2ルートは params から静的データを引くので、twitter-like の詳細ルートと同じく
// `export const instant = false` でブロックを許可して警告を止めている（404 も維持できる）。
// ここが消えると警告が戻るため、ソースで固定する。実際の警告有無は `npm run dev` で該当URLを開いて確認する。
// jsdom 環境では import.meta.url が file: にならないため、リポジトリ直下からの相対パスで読む
const pageDir = join(process.cwd(), "app", "(blog-like)", "pochiblo");
const pages = [
  {
    route: "/pochiblo/[blogId]/entry/[entryId]",
    source: readFileSync(join(pageDir, "[blogId]", "entry", "[entryId]", "page.tsx"), "utf8"),
  },
  {
    route: "/pochiblo/mylist/[mylistId]",
    source: readFileSync(join(pageDir, "mylist", "[mylistId]", "page.tsx"), "utf8"),
  },
];

describe.each(pages)("$route", ({ source }) => {
  it("params をトップレベルで待つので、ブロックを許可している（instant = false）", () => {
    expect(source).toMatch(/export default async function/);
    expect(source).toMatch(/await params/);
    expect(source).toMatch(/^export const instant = false;$/m);
  });

  it("静的パラメータを列挙しているので、既知のページは事前生成のまま", () => {
    expect(source).toMatch(/export function generateStaticParams\(\)/);
  });
});
