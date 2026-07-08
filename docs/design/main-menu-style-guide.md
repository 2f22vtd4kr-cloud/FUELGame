# Main Menu — "Propaganda Pop" Style Guide

**Status:** Approved by user 2026-07-08. Design lives only in the mockup sandbox
(`artifacts/mockup-sandbox/src/components/mockups/main-menu/Propaganda.tsx` +
`Propaganda.css`). **Not yet graduated into the real app.** The live game still
runs the old plain-dark `artifacts/game/src/components/Lobby.tsx`.

## What happened

Used the Canvas mockup workflow to redesign the main menu / lobby screen:

1. Extracted the real `Lobby.tsx` into the sandbox as `Current.tsx` (baseline, exact copy of prod logic/content).
2. Fanned out 3 DESIGN subagent variants exploring visual treatment only (same content/data/behavior): `Noir.tsx` (dark detective noir), `Propaganda.tsx` (Soviet-retro poster), `Arcade.tsx` (glassmorphism mobile-game).
3. User picked **Propaganda Pop**.

## Next step (do this first in the next session)

Run the `mockup-graduate` flow: read `Propaganda.tsx`/`Propaganda.css`, reproduce the same visual
system in `artifacts/game/src/components/Lobby.tsx` (and any shared style helpers), wiring it back
to the real app state (`gs`, `loadProfile`, `ACHIEVEMENTS`, `getDailyChallenge`, `ShopTab`,
`LeaderboardTab`, `t()` i18n) instead of the sandbox's mock data. Keep this style guide as the
reference so `ShopTab.tsx`, `LeaderboardTab.tsx`, `MeetingScreen.tsx`, and other screens can be
brought to the same visual language over time.

## Visual language: Soviet-retro propaganda poster

Tone: bold, satirical, playful — a tongue-in-cheek "state poster" advertising the game, matching
the game's absurdist take on Russian courtyard life. Not somber, not corporate.

### Color palette

| Token | Hex | Use |
|---|---|---|
| `--propaganda-red` | `#cc2b1d` | Primary accent — active states, primary CTA, header banner |
| `--propaganda-mustard` | `#e5a50a` | Secondary accent — progress bars, daily-challenge card, badges |
| `--propaganda-cream` | `#f4ebd0` | Page background, light text on dark surfaces |
| `--propaganda-black` | `#1a1a1a` | Borders, poster-outline shadows, body text on cream/white |
| White (`#fff`) | — | Card surfaces |

Character avatar colors stay as defined in `artifacts/game/src/data/characters.ts` — the poster
system doesn't override per-character brand colors, only the chrome around them.

### Typography

- Font family: `Inter`, sans-serif (already bundled — no new font needed)
- Headings: `font-weight: 900`, `text-transform: uppercase`, tight/negative letter-spacing
  (`-0.05em`), `line-height: 0.8` for the big poster-style logo treatment
- Body/labels: bold (700–900), uppercase, wide tracking for small labels (10px/9px/8px sizes),
  mirroring the original Lobby's compact info-dense sizing

### Signature effects (reusable CSS classes, currently in `Propaganda.css`)

- **`.propaganda-poster-edge`** — `4px solid black` border + `8px 8px 0 black` hard drop shadow.
  This is the primary "card/panel" treatment — every content block uses it instead of soft
  rounded-corner shadows.
- **`.propaganda-button`** — same border + a `4px 4px 0 black` shadow that collapses to `2px 2px`
  and translates the button `2px, 2px` on `:active`, giving a tactile "stamp pressed down" feel.
- **`.propaganda-card`** — plain white card with the black border, no shadow (nested content).
- **`.propaganda-diagonal`** — `clip-path` diagonal banner cut, used behind the header for the
  poster-banner effect.
- **`.propaganda-heading`** — the big uppercase display type treatment described above.
- **`.propaganda-star`** — clip-path 10-point star shape, filled with `--propaganda-red`, for
  decorative Soviet-star accents.
- **`.halftone-overlay`** — a tiny repeating radial-gradient dot pattern (`4px 4px`, 5% opacity)
  laid over the whole page for the newsprint/halftone texture.
- **Paper texture** — `background-image: url(paper-fibers.png)` composited under a cream
  tint, on the root container, for a subtle poster-paper grain. (External texture URL used in the
  mockup; when graduating, download and self-host this asset instead of hot-linking.)
- **Ticker marquee** — `@keyframes ticker` translateX 100% → -100%, `15s linear infinite`, used
  for the "Сегодня в ЖК" flavor-text strip instead of the old fade/interval swap.

### Layout patterns kept from the original

- Mobile-first, single column, `max-width: 380px`, centered
- Same content order: header → profile bar → tabs → (achievements panel) → daily challenge →
  character grid + detail card → game settings (sliders + difficulty grid) → how-to-play →
  CTA stack (daily / single-player / multiplayer / telegram promo) → news ticker → footer
- Same interactive data shape (tab state, selected character, player/traitor count sliders, bot
  difficulty) — only the chrome changed, not the functionality

### Iconography

Variant uses `lucide-react` icons (`Trophy`, `ShoppingBag`, `Gamepad2`, `Medal`, `Flame`,
`ArrowRight`, `Info`, `Zap`) for UI chrome (tabs, achievements button, promo icon) while keeping
emoji for character avatars and flavor text, matching the mockup's approach. `lucide-react` is not
currently a dependency of `artifacts/game` — add it during graduation (`pnpm --filter
@workspace/game add lucide-react`), or re-derive emoji-only versions of these icons if the team
prefers to avoid the new dependency.

## Applying this style guide to future Canvas sessions

When asked to design new screens or redesign existing ones for this game, default to the palette,
typography, and signature effect classes above so everything reads as one consistent "poster"
visual system, unless the user explicitly asks for a different direction.
