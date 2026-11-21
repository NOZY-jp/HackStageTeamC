"use client";

import type { ReactNode } from "react";
import { useStoryOptional } from "@/components/common/story/story-provider";

export function SearchProgressResults({
  beforeDiscovery,
  afterDiscovery,
}: {
  beforeDiscovery: ReactNode;
  afterDiscovery: ReactNode;
}) {
  const story = useStoryOptional();
  return story?.state.flags.includes("foundBff") ? afterDiscovery : beforeDiscovery;
}
