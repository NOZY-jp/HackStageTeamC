"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useFacebook } from "./facebook-context";
import { PostCard } from "./post-card";

export function PostDetailView({ postId }: { postId: string }) {
  const { posts } = useFacebook();
  const post = posts.find((candidate) => candidate.id === postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          href="/talkup"
          className="text-sm font-semibold text-[var(--fb-accent)] hover:underline"
        >
          ← ニュースフィードに戻る
        </Link>
      </div>
      <PostCard post={post} showAllComments />
    </div>
  );
}
