import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadProgress, PROGRESS_EVENT, STORAGE_KEY } from "@/lib/story";
import { StoryTrigger } from "./story-trigger";

beforeEach(() => {
  window.localStorage.clear();
});

describe("きっかけ部品（#81）", () => {
  it("置くとフラグが立ち、保存される", async () => {
    render(<StoryTrigger triggerId="open-mylist" />);

    await waitFor(() => {
      expect(loadProgress().flags).toContain("mylist_opened");
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("mylist_opened");
  });

  it("すでに立っているフラグでは保存し直さない（イベントを出さない）", async () => {
    render(<StoryTrigger triggerId="open-mylist" />);
    await waitFor(() => {
      expect(loadProgress().flags).toContain("mylist_opened");
    });

    const listener = vi.fn();
    window.addEventListener(PROGRESS_EVENT, listener);
    render(<StoryTrigger triggerId="open-mylist" />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(PROGRESS_EVENT, listener);
  });

  it("フラグが変わったことを画面へ知らせる", async () => {
    const listener = vi.fn();
    window.addEventListener(PROGRESS_EVENT, listener);
    render(<StoryTrigger triggerId="find-denchan" />);
    await waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });
    expect(loadProgress().flags).toContain("denchan_found");
    window.removeEventListener(PROGRESS_EVENT, listener);
  });

  it("知らないきっかけIDでは何もしない", async () => {
    render(<StoryTrigger triggerId="missing-trigger" />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(loadProgress().flags).toEqual([]);
  });
});
