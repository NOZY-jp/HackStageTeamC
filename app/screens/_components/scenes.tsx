import type { CSSProperties, ReactNode } from "react";
import { CURRENT_ID, GAME_OLD_DISPLAY_NAME, GAME_OLD_ID, KANON_DISCORD_HANDLE } from "../scenes";

/**
 * 撮影用のモック画面（#103）。文字はすべて HTML テキストで描く。
 * 実在IPのロゴ・商標は使わず、UI の色・配置・雰囲気だけを寄せる。
 */

const FONT = '"Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif';

const frame = (width: number, height: number, background: string): CSSProperties => ({
  width,
  height,
  background,
  position: "relative",
  overflow: "hidden",
  fontFamily: FONT,
  color: "#f5f5f5",
  boxSizing: "border-box",
});

function Bar({ width, color, height = 10 }: { width: string; color: string; height?: number }) {
  return (
    <div style={{ width: "100%", height, background: "rgba(0,0,0,0.55)", borderRadius: 999 }}>
      <div style={{ width, height, background: color, borderRadius: 999 }} />
    </div>
  );
}

function Slot({ n }: { n: number }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(12,16,20,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: 3,
        fontSize: 10,
        color: "#d7dde3",
      }}
    >
      {n}
    </div>
  );
}

/** 2018年・狩猟中のゲーム画面（1200×675）。名前欄 hunter_denden と ID欄 hunter_denden3243 を別項目で併記する。 */
export function GameScene() {
  return (
    <div
      id="screen"
      style={frame(
        1200,
        675,
        "radial-gradient(1200px 700px at 30% 20%, #2c4a3a 0%, #14251d 45%, #0a1410 100%)",
      )}
    >
      {/* 遠景の木々 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(20,60,40,0.55) 0%, rgba(6,16,12,0.2) 40%, rgba(4,10,8,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          height: 220,
          background:
            "repeating-linear-gradient(90deg, rgba(10,28,20,0.9) 0 26px, rgba(16,40,28,0.75) 26px 58px)",
          maskImage: "linear-gradient(180deg, transparent, #000 60%)",
        }}
      />

      {/* 左上: 名前欄・ID欄とHP/スタミナ */}
      <div style={{ position: "absolute", left: 28, top: 24, width: 320 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, letterSpacing: 0.5, color: "#eaf4ed" }}>
            {GAME_OLD_DISPLAY_NAME}
          </span>
          <span style={{ fontSize: 10, color: "#9fb3a6" }}>HR 52</span>
        </div>
        <div style={{ fontSize: 9, color: "#8fa697", marginBottom: 6 }}>ID {GAME_OLD_ID}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Bar width="82%" color="#c0392b" />
          <Bar width="64%" color="#e0b34a" height={7} />
        </div>
      </div>

      {/* 右上: クエスト */}
      <div
        style={{
          position: "absolute",
          right: 28,
          top: 24,
          width: 250,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(8,14,11,0.62)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ fontSize: 10, color: "#9fb3a6", letterSpacing: 1 }}>討伐クエスト</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>リオレウス</div>
        <div style={{ fontSize: 11, color: "#cfe3d6", marginTop: 6 }}>残り時間 42:18</div>
        <div style={{ marginTop: 8 }}>
          <Bar width="35%" color="#7fb3e0" height={6} />
        </div>
      </div>

      {/* 中央: モンスターの影 */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 210,
          width: 330,
          height: 220,
          borderRadius: "48% 52% 42% 58%",
          background: "radial-gradient(circle at 40% 35%, #7a2c1e, #3d140c 70%)",
          filter: "blur(1px)",
          opacity: 0.9,
        }}
      />

      {/* 下部: アイテムバー */}
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 22,
          display: "flex",
          gap: 6,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <Slot key={n} n={n} />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          right: 28,
          bottom: 26,
          fontSize: 12,
          color: "#cfe3d6",
          textAlign: "right",
          lineHeight: 1.6,
        }}
      >
        所持金 24,580 z
        <br />
        調査ポイント 1,240
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 18,
          transform: "translateX(-50%)",
          fontSize: 11,
          color: "rgba(235,245,238,0.6)",
        }}
      >
        集会所エリア 8 / 古代樹の森
      </div>
    </div>
  );
}

function RailDot({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 16,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#fff",
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}

function FriendRow({ name, handle, color }: { name: string; handle: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {name.slice(0, 1)}
      </div>
      <div style={{ lineHeight: 1.35 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 11, color: "#9aa3ad" }}>{handle}</div>
      </div>
    </div>
  );
}

/** 2026年・Discord のフレンド一覧（800×600）。MaiMai 本人視点（左下が自分 maimaimaimai、フレンドに 琥珀・かのん）。 */
export function DiscordFriendsScene() {
  return (
    <div id="screen" style={frame(800, 600, "#1e1f22")}>
      <div style={{ display: "flex", height: "100%" }}>
        {/* サーバーレール */}
        <div
          style={{
            width: 64,
            background: "#1a1b1e",
            paddingTop: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <RailDot label="D" color="#5865f2" />
          <div style={{ width: 32, height: 1, background: "#2f3136" }} />
          <RailDot label="M" color="#3f8f5b" />
        </div>

        {/* チャンネル一覧 */}
        <div
          style={{
            width: 210,
            background: "#2b2d31",
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, padding: "4px 8px" }}>
            ダイレクトメッセージ
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "6px 8px",
              borderRadius: 4,
              background: "#404249",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            フレンド
          </div>
          <div style={{ marginTop: 4, padding: "6px 8px", fontSize: 13, color: "#b5bac1" }}>
            オンライン
          </div>
          <div style={{ marginTop: 4, padding: "6px 8px", fontSize: 13, color: "#b5bac1" }}>
            すべて
          </div>

          {/* 左下: 自分のユーザーパネル（MaiMai 本人視点） */}
          <div
            style={{
              marginTop: "auto",
              background: "#232428",
              borderRadius: 8,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#c2417c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              ま
            </div>
            <div style={{ lineHeight: 1.35 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>まいまい</div>
              <div style={{ fontSize: 10, color: "#9aa3ad" }}>{CURRENT_ID}</div>
            </div>
          </div>
        </div>

        {/* メイン */}
        <div style={{ flex: 1, background: "#313338", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              height: 44,
              borderBottom: "1px solid #26272b",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            フレンド
            <span style={{ marginLeft: 10, fontSize: 11, color: "#b5bac1" }}>オンライン — 2</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: "#b5bac1", padding: "0 10px 4px" }}>オンライン</div>
            <FriendRow name="琥珀" handle="kohakunchos0117" color="#4f6f8a" />
            <FriendRow name="かのん" handle={KANON_DISCORD_HANDLE} color="#c2563f" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyMember({
  name,
  id,
  rank,
  color,
}: {
  name: string;
  id?: string;
  rank: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.06)",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {name.slice(0, 1)}
      </div>
      <div style={{ lineHeight: 1.4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        {id ? <div style={{ fontSize: 10, color: "#8fa0ad" }}>ID {id}</div> : null}
        <div style={{ fontSize: 11, color: "#a9b6c0" }}>{rank}</div>
      </div>
    </div>
  );
}

/** 2019年・ロビー/パーティ画面（800×600）。名前欄 hunter_denden と ID欄 hunter_denden3243 が写る。 */
export function LobbyScene() {
  return (
    <div
      id="screen"
      style={frame(800, 600, "linear-gradient(160deg, #2a3b46 0%, #16232b 40%, #0b1217 100%)")}
    >
      <div
        style={{
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>集会所</div>
        <div style={{ fontSize: 11, color: "#a9b6c0" }}>パーティ 4 / 4・2019</div>
      </div>

      <div style={{ display: "flex", gap: 18, padding: 22, height: 440 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            background:
              "radial-gradient(600px 340px at 40% 30%, rgba(120,170,200,0.18), rgba(10,18,24,0.6))",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 18,
            fontSize: 12,
            color: "#cfdae2",
            lineHeight: 2,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>クエストボード</div>
          <div>・牙竜種の討伐（★7）</div>
          <div>・歴戦の個体の調査（★9）</div>
          <div>・素材集めツアー（★4）</div>
          <div style={{ marginTop: 18, color: "#9fb0bd" }}>ロビーID 4f2c-9a</div>
        </div>

        <div style={{ width: 300 }}>
          <div style={{ fontSize: 11, color: "#a9b6c0", marginBottom: 8 }}>パーティメンバー</div>
          <PartyMember
            name={GAME_OLD_DISPLAY_NAME}
            id={GAME_OLD_ID}
            rank="HR 52・双剣"
            color="#7a6a3f"
          />
          <PartyMember name="gunlance_taro" rank="HR 61・ガンランス" color="#57f287" />
          <PartyMember name="bow_haruka" rank="HR 44・弓" color="#9b59b6" />
          <PartyMember name="switchaxe_mio" rank="HR 38・スラアク" color="#8a6fb0" />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 22,
          bottom: 18,
          fontSize: 11,
          color: "rgba(207,218,226,0.65)",
        }}
      >
        Enter で準備完了 / Tab でメニュー
      </div>
    </div>
  );
}

export function SceneView({ scene }: { scene: "game2018" | "discord2026" | "lobby2019" }) {
  const content: ReactNode =
    scene === "game2018" ? (
      <GameScene />
    ) : scene === "discord2026" ? (
      <DiscordFriendsScene />
    ) : (
      <LobbyScene />
    );
  return content;
}
