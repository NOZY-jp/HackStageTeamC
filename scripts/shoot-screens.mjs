/**
 * 撮影用モック画面（/screens/<scene>）を PNG に撮る（#103 の撮影手順）。
 *
 * 使い方:
 *   1) `npm run dev`（または `npm run build && npm run start`）を起動
 *   2) `node scripts/shoot-screens.mjs [baseUrl]`
 *      例: node scripts/shoot-screens.mjs http://127.0.0.1:3000
 *
 * Chrome をヘッドレスで起動し、`--window-size` を画面サイズそのものにして撮る。
 * `--hide-scrollbars` でスクロールバー領域（右端15pxの黒帯）を出さない。
 * 撮影後に右端5列が純黒でないことを検査し、純黒なら異常終了する。
 * Chrome の場所は環境変数 CHROME_PATH で上書きできる。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const SCENES = [
  {
    id: "game2018",
    width: 1200,
    height: 675,
    output: "public/discord-like/screenshot-2018-game.png",
  },
  {
    id: "discord2026",
    width: 800,
    height: 600,
    output: "public/discord-like/screenshot-2026-friends.png",
  },
  {
    id: "lobby2019",
    width: 800,
    height: 600,
    output: "public/discord-like/screenshot-2019-lobby.png",
  },
];

/** PNG の右端列が純黒かどうか（sharp がある時だけ検査する）。 */
async function checkRightEdge(file, width) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log(`  (skip edge check: sharp not installed) ${file}`);
    return true;
  }
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const black = [];
  for (let x = width - 5; x < width; x += 1) {
    for (let y = 0; y < info.height; y += 40) {
      const i = (y * info.width + x) * channels;
      if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) black.push(x);
    }
  }
  const pureBlack = black.length === 0;
  const edge = [width - 15, width - 1].map((x) => {
    const i = (Math.floor(info.height / 2) * info.width + x) * channels;
    return `x=${x} rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
  });
  console.log(`  edge: ${edge.join(" / ")} -> ${pureBlack ? "純黒（NG）" : "非黒（OK）"}`);
  return !pureBlack;
}

let failed = false;
for (const scene of SCENES) {
  const out = path.resolve(scene.output);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.rmSync(out, { force: true });
  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      `--window-size=${scene.width},${scene.height}`,
      `--screenshot=${out}`,
      `${BASE}/screens/${scene.id}`,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0 || !fs.existsSync(out)) {
    console.error(`failed: ${scene.id}`);
    failed = true;
    continue;
  }
  console.log(`${scene.id} -> ${scene.output} (${scene.width}x${scene.height})`);
  if (!(await checkRightEdge(out, scene.width))) failed = true;
}

process.exit(failed ? 1 : 0);
