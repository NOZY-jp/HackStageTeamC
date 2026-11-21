/**
 * 確認画面の「単体再生」を、その場面の起きる画面（Discord の通話など）の上で流すための受け渡し。
 * 確認画面が場面 ID を sessionStorage に置いて画面を移し、StoryStage が読んで流す（進行状態は変えない）。
 * 確認画面と同じく、本番では使えない（NEXT_PUBLIC_STORY_CONSOLE=1 のときだけ）。
 */
const KEY = "hackstage:story-preview:v1";

export function scenePreviewEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_STORY_CONSOLE === "1";
}

export function requestScenePreview(beatId: string) {
  try {
    window.sessionStorage.setItem(KEY, beatId);
  } catch {
    // 置けなければ、単体再生は確認画面の上で流れるだけ
  }
}

export function loadScenePreview(): string | undefined {
  if (!scenePreviewEnabled()) return undefined;
  try {
    return window.sessionStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function clearScenePreview() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 消せなくても、次に確認画面から流すときに上書きされる
  }
}
