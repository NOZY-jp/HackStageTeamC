import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `globals: false` のため、テストごとに DOM を掃除する
afterEach(() => {
  cleanup();
});
