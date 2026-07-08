// §13.2 Localization — UI chrome only (Russian + English).
// Per the design doc, satire content (voice lines, ejection texts, news
// headlines, character banter) stays Russian-only in both languages —
// "satire doesn't translate, but the game is playable." This dictionary
// covers navigation, headers, and other structural UI text so the game is
// fully navigable in English without translating flavor/satire copy.

export type Lang = 'ru' | 'en';

export const STRINGS = {
  // Lobby
  lobby_tab_game: { ru: 'Игра', en: 'Play' },
  lobby_tab_shop: { ru: 'Магазин', en: 'Shop' },
  lobby_tab_leaderboard: { ru: 'Рейтинг', en: 'Leaderboard' },
  lobby_start: { ru: 'Начать игру', en: 'Start Game' },
  lobby_multiplayer: { ru: 'Онлайн-игра', en: 'Online Match' },
  lobby_players: { ru: 'Игроков', en: 'Players' },
  lobby_slivshchiki_count: { ru: 'Сливщиков', en: 'Traitors' },
  lobby_difficulty: { ru: 'Сложность', en: 'Difficulty' },
  lobby_achievements: { ru: 'Достижения', en: 'Achievements' },
  lobby_daily_challenge: { ru: 'Ежедневное задание', en: 'Daily Challenge' },

  // Roles / HUD
  role_khozain: { ru: '🏠 ХОЗЯИН', en: '🏠 RESIDENT' },
  role_slivshchik: { ru: '🪣 СЛИВЩИК', en: '🪣 TRAITOR' },
  hud_unity: { ru: 'ЕДИНСТВО ДВОРА', en: 'COURTYARD UNITY' },
  hud_what_to_do: { ru: 'Что делать?', en: "What's next?" },
  hud_settings: { ru: 'Настройки', en: 'Settings' },

  // Meeting
  meeting_title: { ru: '📢 СХОДКА', en: '📢 MEETING' },
  meeting_discussion: { ru: 'Обсуждение', en: 'Discussion' },
  meeting_voting: { ru: 'Голосование', en: 'Voting' },
  meeting_reveal: { ru: 'Итоги', en: 'Results' },
  meeting_skip_to_vote: { ru: '⏭️ К голосованию', en: '⏭️ Skip to Vote' },
  meeting_quick_chat: { ru: '💬 Быстрый чат', en: '💬 Quick Chat' },

  // Results
  result_win: { ru: 'ПОБЕДА!', en: 'VICTORY!' },
  result_lose: { ru: 'ПОРАЖЕНИЕ', en: 'DEFEAT' },
  result_play_again: { ru: 'Играть снова', en: 'Play Again' },
  result_back_to_lobby: { ru: 'В лобби', en: 'Back to Lobby' },

  // Settings toggle
  settings_language: { ru: 'Язык', en: 'Language' },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang] ?? STRINGS[key].ru;
}
