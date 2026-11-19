"use client";

import { useEffect, useRef, useState } from "react";

/**
 * アクセスカウンター。ページを開くたびに1増える。
 * 保存先が無いので、増えた分はこのブラウザの localStorage にだけ持つ（ほかの人の画面には反映されない）。
 * サーバーとクライアントで最初の表示を揃えるため、初回は base のまま描き、表示後に増やす。
 */
export function AccessCounter({ blogId, base }: { blogId: string; base: number }) {
  const [count, setCount] = useState(base);
  const counted = useRef(false);

  useEffect(() => {
    // 開発時の二重実行で2回数えないようにする
    if (counted.current) {
      return;
    }
    counted.current = true;
    const key = `pochiblo:counter:${blogId}`;
    let visits = 1;
    try {
      visits = Number(window.localStorage.getItem(key) ?? "0") + 1;
      window.localStorage.setItem(key, String(visits));
    } catch {
      // プライベートウィンドウなどで保存できなくても、この表示の分だけは数える
    }
    setCount(base + visits);
  }, [blogId, base]);

  return (
    <>
      <p className="visually-hidden">訪問者数 {count}人</p>
      <p className="pb-counter" aria-hidden="true">
        {String(count)
          .padStart(6, "0")
          .split("")
          .map((digit, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 桁の位置そのものがキー
            <span key={index}>{digit}</span>
          ))}
      </p>
    </>
  );
}
