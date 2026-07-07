// ─── §3.4 Inventory & Cosmetics Catalog ──────────────────────────────────────

export type CurrencyType = 'babki' | 'stars' | 'free' | 'fuel_linked' | 'daily';

export interface HatDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  currency: CurrencyType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  battlePassTier?: number;
}

export const HATS: HatDef[] = [
  // ── Free / Starter ──────────────────────────────────────────────────────
  { id: 'none',         name: 'Без шапки',       emoji: '😶', description: 'Голова на ветру.', cost: 0, currency: 'free', rarity: 'common' },
  { id: 'ushanka',      name: 'Ушанка',           emoji: '🐻', description: 'Классика ЖК.', cost: 0, currency: 'free', rarity: 'common' },

  // ── Бабки purchases ───────────────────────────────────────────────────────
  { id: 'cap_yellow',   name: 'Кепка Яндекс',     emoji: '🧢', description: 'Для таксистов и не только.', cost: 100, currency: 'babki', rarity: 'common' },
  { id: 'hardhat',      name: 'Строительная каска', emoji: '⛑️', description: 'Техника безопасности.', cost: 150, currency: 'babki', rarity: 'common' },
  { id: 'cowboy',       name: 'Ковбойская шляпа', emoji: '🤠', description: 'На диком Западе тоже сливают.', cost: 200, currency: 'babki', rarity: 'common' },
  { id: 'beret',        name: 'Берет',            emoji: '🎩', description: 'Французский шик в дворе.', cost: 250, currency: 'babki', rarity: 'common' },
  { id: 'traffic_cone', name: 'Конус',            emoji: '🔺', description: 'Найден на парковке.', cost: 300, currency: 'babki', rarity: 'rare' },
  { id: 'graduation',   name: 'Академическая',    emoji: '🎓', description: 'Диплом есть, работа — нет.', cost: 350, currency: 'babki', rarity: 'rare' },
  { id: 'party_hat',    name: 'Праздничный колпак', emoji: '🎉', description: 'Всегда повод.', cost: 400, currency: 'babki', rarity: 'rare' },
  { id: 'witch_hat',    name: 'Шляпа ведьмы',     emoji: '🧙', description: 'Колдуй не колдуй...', cost: 450, currency: 'babki', rarity: 'rare' },
  { id: 'crown_basic',  name: 'Корона ЖК',        emoji: '👑', description: 'Король двора.', cost: 800, currency: 'babki', rarity: 'epic' },
  { id: 'beret_red',    name: 'Красный берет',    emoji: '🎀', description: 'ОМОНовский шик.', cost: 600, currency: 'babki', rarity: 'epic' },

  // ── Telegram Stars purchases ───────────────────────────────────────────────
  { id: 'stars_lambo',  name: 'Крипто-Ламбо',     emoji: '🏎️', description: 'NFT шапки не существует. Эта — существует.', cost: 50, currency: 'stars', rarity: 'rare' },
  { id: 'stars_gold_ticket', name: 'Золотой Талон', emoji: '🎫', description: 'Цена зафиксирована навсегда.', cost: 75, currency: 'stars', rarity: 'epic' },
  { id: 'stars_crown',  name: 'Корона Барона',    emoji: '👸', description: 'Топливный Барон.', cost: 100, currency: 'stars', rarity: 'legendary' },
  { id: 'stars_santa',  name: 'Дед Мороз',        emoji: '🎅', description: 'Дед Мороз тоже сливает. По старой цене.', cost: 80, currency: 'stars', rarity: 'epic' },

  // ── Battle Pass rewards ────────────────────────────────────────────────────
  { id: 'bp_tier3',     name: 'Кепка Пропуска',   emoji: '🏷️', description: 'Боевой Пропуск, уровень 3.', cost: 0, currency: 'free', rarity: 'common', battlePassTier: 3 },
  { id: 'bp_tier7',     name: 'Бейсболка БП',     emoji: '🧤', description: 'Боевой Пропуск, уровень 7.', cost: 0, currency: 'free', rarity: 'rare', battlePassTier: 7 },
  { id: 'bp_tier10',    name: 'Шлем Сезона',      emoji: '⚔️', description: 'Боевой Пропуск, уровень 10.', cost: 0, currency: 'free', rarity: 'epic', battlePassTier: 10 },

  // ── Special (fuel_linked) ──────────────────────────────────────────────────
  { id: 'golden_talono', name: 'Золотой Москвич', emoji: '🥇', description: 'За привязку @fuel_fuel_fuel_bot.', cost: 0, currency: 'fuel_linked', rarity: 'legendary' },

  // ── §3.5 Daily exclusive hats — one per day-of-week, only via daily challenge ─
  { id: 'daily_mon', name: 'Синяя кепка',      emoji: '🔵', description: 'Эксклюзив понедельника. Тяжело, но ты справился.', cost: 0, currency: 'daily', rarity: 'rare' },
  { id: 'daily_tue', name: 'Красная беретка',  emoji: '🔴', description: 'Эксклюзив вторника. Вторник — день храбрых.',        cost: 0, currency: 'daily', rarity: 'rare' },
  { id: 'daily_wed', name: 'Зелёный картуз',   emoji: '🟢', description: 'Эксклюзив среды. Экватор недели пройден.',            cost: 0, currency: 'daily', rarity: 'rare' },
  { id: 'daily_thu', name: 'Жёлтая каска',     emoji: '🟡', description: 'Эксклюзив четверга. Предпятничный энтузиазм.',        cost: 0, currency: 'daily', rarity: 'rare' },
  { id: 'daily_fri', name: 'Пятничный венец',  emoji: '🎊', description: 'Эксклюзив пятницы. Ты заслужил.',                    cost: 0, currency: 'daily', rarity: 'epic' },
  { id: 'daily_sat', name: 'Субботний цилиндр',emoji: '🎩', description: 'Эксклюзив субботы. Ленивый шик.',                    cost: 0, currency: 'daily', rarity: 'epic' },
  { id: 'daily_sun', name: 'Воскресный нимб',  emoji: '😇', description: 'Эксклюзив воскресенья. Ты почти святой.',            cost: 0, currency: 'daily', rarity: 'epic' },
];

export const HAT_MAP: Record<string, HatDef> = Object.fromEntries(HATS.map(h => [h.id, h]));

export const RARITY_COLORS: Record<HatDef['rarity'], string> = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};
