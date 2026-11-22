import { LEAF_CREATOR_ID } from "../../blog-migration/articles";
import type { Creator } from "../types";

/** 書き手。脚本（docs/）が固まるまでの仮データ。 */
export const creators: Creator[] = [
  {
    // 旧ブログ（ぽちブロ）からの引っ越し先。
    id: LEAF_CREATOR_ID,
    displayName: "MaiMai",
    bio: "夜にゲームをして、朝に後悔する会社員。昔は「でんでん」名義で攻略日記を書いていました。",
    avatar: "/note-like/avatars/mai.svg",
    avatarColor: "#7c9cbf",
  },
  {
    id: "tsukimi_guild",
    displayName: "月見亭ギルド通信",
    bio: "のんびり勢ギルド「月見亭」の活動記録。週末レイドと雑談が主食です。",
    avatar: "/note-like/avatars/tsukimi-guild.svg",
    avatarColor: "#c9973f",
  },
  {
    id: "kado_coffee",
    displayName: "かどの珈琲",
    bio: "駅前の小さな喫茶店。豆のこと、店のこと、たまに猫のこと。",
    avatar: "/note-like/avatars/kado-coffee.svg",
    avatarColor: "#8a6a55",
  },
  {
    id: "asagiri_photo",
    displayName: "朝霧 拓也",
    bio: "週末に古いレンジファインダーと散歩する会社員。現像代で毎月お小遣いが溶ける。",
    avatarColor: "#2b5b6c",
  },
  {
    id: "yofukashi_pad",
    displayName: "よふかしパッド",
    bio: "平日は23時から1時間だけ遊ぶ社会人ゲーマー。積みゲーとコントローラー修理の記録。",
    avatarColor: "#4b4e6d",
  },
  {
    id: "nana_sound",
    displayName: "ななせ音響部",
    bio: "社会人バンドでベース担当。リハスタの機材と耳栓と歪みペダルの話ばかり書きます。",
    avatarColor: "#7a4966",
  },
  {
    id: "tsugumi_books",
    displayName: "つぐみ書店日誌",
    bio: "古本屋の100円棚と図書館の予約棚を行き来する人。読了率より積読の厚みが増す毎日。",
    avatarColor: "#3f6a58",
  },
  {
    id: "kino_diy",
    displayName: "木工のキノ",
    bio: "ベランダの折りたたみ作業台で棚やスツールを作っています。直角が出ないのが悩み。",
    avatarColor: "#8c5e35",
  },
  {
    id: "senro_tabi",
    displayName: "線路わきの手帳",
    bio: "休日に普通列車とローカル線だけで出かける旅の記録。時刻表と駅の立ち食いそばが頼りです。",
    avatarColor: "#3b5978",
  },
  {
    id: "hakkou_daidokoro",
    displayName: "台所の発酵帖",
    bio: "味噌・ぬか床・塩麹をちまちま育てる自炊記録。失敗した瓶も隠さず書きます。",
    avatarColor: "#a3573b",
  },
  {
    id: "mokumoku_exam",
    displayName: "もくもく勉強録",
    bio: "働きながら資格試験に挑戦中。朝勉の失敗談と過去問周回のメモを残しています。",
    avatarColor: "#4f5d75",
  },
  {
    id: "shomu_memo",
    displayName: "総務のすみっこ",
    bio: "社員30人ほどの会社で総務と情シスを兼任。引き継ぎと備品管理の雑記を書いています。",
    avatarColor: "#556b6d",
  },
  {
    id: "chatora_days",
    displayName: "茶トラの隣で",
    bio: "元保護猫の茶トラ（推定11歳）と2DK暮らし。通院と毛玉と深夜の運動会の記録。",
    avatarColor: "#b36a3c",
  },
  {
    id: "rinrin_cycle",
    displayName: "川沿いペダル記",
    bio: "片道12kmの川沿い自転車通勤と週末ポタリング。空気圧と向かい風の記録。",
    avatarColor: "#2d6a4f",
  },
  {
    id: "hachiue_note",
    displayName: "ベランダの鉢植え",
    bio: "日当たりの微妙な北向き窓で観葉植物を育てています。水やり過多からの失敗多め。",
    avatarColor: "#4a7c59",
  },
  {
    id: "nui_to_kawa",
    displayName: "糸と革のあいま",
    bio: "ジーンズの繕いと小さな革小物づくり。休日に手を動かす時間がいちばん落ち着きます。",
    avatarColor: "#7c4d6b",
  },
];
