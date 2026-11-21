import { afterEach, describe, expect, it, vi } from "vitest";
import { searchGoogle } from "./google";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("searchGoogle", () => {
  it("sends a predefined public term with API authentication in the header", async () => {
    vi.stubEnv("SEARCHAPI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        organic_results: [
          { title: "写真の撮り方", link: "https://example.com/photo", snippet: "撮影ガイド" },
          { title: "同じURL", link: "https://example.com/photo" },
          { title: "無効なリンク", link: "javascript:alert(1)" },
          { title: "カメラ入門", link: "https://example.org/" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchGoogle("写真　撮り方");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.searchParams.get("q")).toBe("写真 撮り方");
    expect(url.searchParams.has("api_key")).toBe(false);
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(results.map(({ title }) => title)).toEqual(["写真の撮り方", "カメラ入門"]);
  });

  it("keeps arbitrary or unconfigured queries local", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SEARCHAPI_API_KEY", "test-key");
    expect(await searchGoogle("写真 private@example.com")).toEqual([]);
    vi.stubEnv("SEARCHAPI_API_KEY", "");
    expect(await searchGoogle("写真")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns no web results when the provider fails", async () => {
    vi.stubEnv("SEARCHAPI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchGoogle("写真")).toEqual([]);
    expect(await searchGoogle("写真")).toEqual([]);
  });
});
