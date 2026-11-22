"use client";

import { hasTalkupPrereqs } from "@/app/(facebook-like)/talkup/reveal";
import { useOptionalStory } from "@/components/common/story/story-provider";
import { StoryTrigger } from "@/components/common/story/story-trigger";

/**
 * 段階10の対象（u40）のプロフィールを開いたときに s10-talkup-match を立てる。
 * ただしカイの連絡（順序9）まで進んでいる場合だけ（#275）。
 * 順序8の直後にプロフィールを直接開いても、本人を確かめる段階には早すぎる。
 */
export function TalkupMatchTrigger({ delayMs }: { delayMs?: number }) {
  const story = useOptionalStory();
  // StoryProvider の外（単体テストなど）や、保存を読み終える前は立てない
  if (!hasTalkupPrereqs(story?.state.flags ?? [])) {
    return null;
  }
  return <StoryTrigger flag="s10-talkup-match" delayMs={delayMs} />;
}
