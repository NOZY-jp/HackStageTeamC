import { LEAF_CREATOR_ID, migrationArticles } from "../../blog-migration/articles";
import type { Article } from "../types";

export const articles: Article[] = migrationArticles.map(
  ({ publishedAt, category, title, paragraphs }) => ({
    id: `migration-${publishedAt.slice(0, 10)}`,
    creatorId: LEAF_CREATOR_ID,
    title,
    excerpt: paragraphs[0],
    publishedAt,
    tags: ["モンハン", category],
    likeCount: 0,
    body: paragraphs.map((text) => ({ kind: "paragraph", text })),
  }),
);
