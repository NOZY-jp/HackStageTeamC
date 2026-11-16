"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

const MAX_LENGTH = 2000;
/** 5行ぶんの高さ。これを超えたらテキストエリア内でスクロールする。 */
const MAX_HEIGHT = 120;

/**
 * メッセージ入力欄。Enter で送信、Shift+Enter で改行。
 * IME 変換中の Enter（compositionstart〜compositionend）では送信しない。
 */
export function MessageComposer({
  onSend,
  placeholder = "メッセージを送信",
  disabled = false,
}: {
  onSend: (body: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const composingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;

  // 内容に応じて 1行〜5行の高さに伸ばす
  // biome-ignore lint/correctness/useExhaustiveDependencies: value の変化を高さの再計算のトリガーにするための依存
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    if (!canSend) {
      return;
    }
    onSend(value.trim());
    setValue("");
    // 送信後も続けて打てるようにフォーカスを残す
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    // IME の変換確定 Enter では送信しない（ref と isComposing の両方を見る）
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }
    event.preventDefault();
    submit();
  };

  return (
    <form
      className="message-composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {/* ＋は見た目のみ（添付機能は #11 の非対象）。押しても何も起きない */}
      <button
        type="button"
        className="message-composer-attach"
        aria-label="添付（準備中）"
        title="添付（準備中）"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <textarea
        ref={textareaRef}
        className="message-composer-input"
        rows={1}
        maxLength={MAX_LENGTH}
        value={value}
        placeholder={placeholder}
        aria-label="メッセージ"
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
        }}
      />
      <button type="submit" className="message-composer-send" aria-label="送信" disabled={!canSend}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 12 16-8-6 8 6 8-16-8Z" />
        </svg>
      </button>
    </form>
  );
}
