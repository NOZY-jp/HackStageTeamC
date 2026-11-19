"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { getSelfUser, listPosts } from "@/lib/facebook-like";
import type { FbComment, FbPost, FbReactionType, FbUser } from "@/lib/facebook-like/types";

type CreatePostInput = {
  body: string;
  feeling?: string;
  audience: "public" | "friends";
};

type FacebookContextValue = {
  selfUser: FbUser;
  posts: FbPost[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createPost: (input: CreatePostInput) => void;
  toggleReaction: (postId: string, reaction?: FbReactionType) => void;
  addComment: (postId: string, body: string) => void;
  incrementShare: (postId: string) => void;
};

const FacebookContext = createContext<FacebookContextValue | null>(null);

export function FacebookProvider({ children }: { children: ReactNode }) {
  const selfUser = useMemo(() => getSelfUser(), []);
  const [posts, setPosts] = useState<FbPost[]>(() => listPosts());
  const [searchQuery, setSearchQuery] = useState("");

  const createPost = useCallback(
    ({ body, feeling, audience }: CreatePostInput) => {
      const trimmed = body.trim();
      if (!trimmed) {
        return;
      }
      const newPost: FbPost = {
        id: `fbp-local-${Date.now()}`,
        authorId: selfUser.id,
        body: trimmed,
        createdAt: new Date().toISOString(),
        feeling: feeling?.trim() || undefined,
        audience,
        reactions: {},
        comments: [],
        shares: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
    },
    [selfUser.id],
  );

  const toggleReaction = useCallback((postId: string, reaction: FbReactionType = "like") => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) {
          return post;
        }
        const nextReactions = { ...post.reactions };
        const previous = post.myReaction;

        if (previous) {
          const prevCount = nextReactions[previous] ?? 0;
          if (prevCount <= 1) {
            delete nextReactions[previous];
          } else {
            nextReactions[previous] = prevCount - 1;
          }
        }

        if (previous === reaction) {
          return {
            ...post,
            reactions: nextReactions,
            myReaction: undefined,
          };
        }

        nextReactions[reaction] = (nextReactions[reaction] ?? 0) + 1;
        return {
          ...post,
          reactions: nextReactions,
          myReaction: reaction,
        };
      }),
    );
  }, []);

  const addComment = useCallback(
    (postId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) {
        return;
      }
      const newComment: FbComment = {
        id: `fbc-local-${Date.now()}`,
        postId,
        authorId: selfUser.id,
        body: trimmed,
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, newComment],
              }
            : post,
        ),
      );
    },
    [selfUser.id],
  );

  const incrementShare = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, shares: post.shares + 1 } : post)),
    );
  }, []);

  const value = useMemo<FacebookContextValue>(
    () => ({
      selfUser,
      posts,
      searchQuery,
      setSearchQuery,
      createPost,
      toggleReaction,
      addComment,
      incrementShare,
    }),
    [selfUser, posts, searchQuery, createPost, toggleReaction, addComment, incrementShare],
  );

  return <FacebookContext.Provider value={value}>{children}</FacebookContext.Provider>;
}

export function useFacebook() {
  const ctx = useContext(FacebookContext);
  if (!ctx) {
    throw new Error("useFacebook must be used within FacebookProvider");
  }
  return ctx;
}
