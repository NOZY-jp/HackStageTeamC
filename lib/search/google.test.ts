import { afterEach, describe, expect, it, vi } from "vitest";
import { searchExternalWeb } from "./google";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("searchExternalWeb", () => {
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

    const results = await searchExternalWeb("写真　撮り方");
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
    expect(await searchExternalWeb("写真 private@example.com")).toEqual([]);
    vi.stubEnv("SEARCHAPI_API_KEY", "");
    expect(await searchExternalWeb("写真")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns no web results when the provider fails", async () => {
    vi.stubEnv("SEARCHAPI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchExternalWeb("写真")).toEqual([]);
    expect(await searchExternalWeb("写真")).toEqual([]);
  });

  it.each(["弓属性強化ガン積み構", "弓属性強化ガン積み構成"])(
    "shows bow references for %s without an API key",
    async (query) => {
      vi.stubEnv("SEARCHAPI_API_KEY", "");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const results = await searchExternalWeb(query);
      expect(results).toHaveLength(3);
      expect(results[0]?.url).toBe("https://game8.jp/mhw/199253");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("sends only the fixed bow query and falls back if the API returns no results", async () => {
    vi.stubEnv("SEARCHAPI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ organic_results: [] }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchExternalWeb("弓属性強化 private@example.com")).toHaveLength(3);
    const [url] = fetchMock.mock.calls[0];
    expect(url.searchParams.get("q")).toBe("モンハン 弓 属性強化");
  });
});
