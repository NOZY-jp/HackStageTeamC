import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TwitterTimelinePage from "./page";

/** 両タブともサーバーで同じリストを描き、tabpanel として両方 DOM に残る。 */
const tabPanels = () => screen.getAllByRole("tabpanel", { hidden: true });

describe("TwitterTimelinePage", () => {
  it("ホーム（おすすめ・フォロー中の両方）にかのんの投稿と開設前の古い投稿を出さない", () => {
    render(<TwitterTimelinePage />);
    const panels = tabPanels();
    expect(panels.length).toBe(2);
    for (const panel of panels) {
      // かのんはリョウがまだ知らない（フォローしていない）のでホームに出ない
      expect(within(panel).queryByText("かのん")).toBeNull();
      expect(within(panel).queryByText(/アルバムを整理してたら/)).toBeNull();
      // フォロー中の Mai の投稿でも、リョウの開設（2026-11）前の投稿は出ない
      expect(within(panel).queryByText(/クラッチクロー/)).toBeNull();
      // フォロー中と自分の近況の投稿は出る
      expect(within(panel).getByText(/あと4日/)).toBeInTheDocument();
      expect(within(panel).getByText(/来週末、1年半越しにはじめて会う/)).toBeInTheDocument();
    }
  });
});
