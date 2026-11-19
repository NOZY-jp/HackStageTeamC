"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { FbAvatar } from "./avatar";
import { useFacebook } from "./facebook-context";

const FEELINGS = ["", "ワクワク", "集中モード", "コーヒー休憩", "感謝", "眠い"] as const;

export function PostComposer() {
  const { selfUser, createPost } = useFacebook();
  const [body, setBody] = useState("");
  const [feeling, setFeeling] = useState<string>("");
  const [audience, setAudience] = useState<"public" | "friends">("public");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      return;
    }
    createPost({ body, feeling, audience });
    setBody("");
    setFeeling("");
  };

  return (
    <section className="fb-card p-4" aria-label="新規投稿">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start gap-3">
          <Link href={`/talkup/profile/${selfUser.handle}`} className="shrink-0">
            <FbAvatar
              displayName={selfUser.displayName}
              avatarColor={selfUser.avatarColor}
              status={selfUser.status}
              size="md"
              showStatus
            />
          </Link>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`${selfUser.displayName}さん、その気持ち、シェアしよう`}
            aria-label="投稿内容を入力"
            rows={2}
            className="fb-composer-textarea"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--fb-border)]">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--fb-muted)] flex items-center gap-1">
              <span>気分:</span>
              <select
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                className="fb-select"
                aria-label="気分を選択"
              >
                <option value="">なし</option>
                {FEELINGS.filter(Boolean).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[var(--fb-muted)] flex items-center gap-1">
              <span>公開範囲:</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as "public" | "friends")}
                className="fb-select"
                aria-label="公開範囲を選択"
              >
                <option value="public">公開</option>
                <option value="friends">友達のみ</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={!body.trim()} className="fb-primary-btn">
            投稿する
          </button>
        </div>
      </form>
    </section>
  );
}
