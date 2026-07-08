# Production Standards — read this every session

This document exists because of a direct reset-of-expectations from the project
owner (July 2026). It is not optional guidance — it is the bar every change to
this game must clear before being considered done. If this file is ever
missing from a fresh import, that is a bug: re-derive it from
`attached_assets/Pasted-Replit-this-is-a-reset-of-expectations*.txt` if still
present, or from this summary.

## The core complaint

Despite many sessions of work from multiple frontier models, the game still
reads as an early prototype: inconsistent vehicle scale/shadows, a cluttered
HUD, desktop keyboard hints on a phone-only game, a placeholder joke string
shipped to production ("[E] БЫМ!"), abrupt audio cuts, and unpolished
movement. The diagnosis: every session fixed one isolated thing without
asking "what does this break elsewhere?" or "does this match our established
visual language?" That is unacceptable for a project meant to stand beside
commercial games in its genre.

## Operating rules

1. **Stop solving one problem at a time.** Before changing an asset, a
   mechanic, or a UI element, check how it fits everything around it —
   scale, palette, shadow direction, interaction pattern, audio behavior.
   A fix that creates a new inconsistency is not a fix.
2. **Research before implementing.** This is a top-down social-deduction
   game. Before touching movement, camera, HUD, lighting, or interaction
   feedback, consider how proven games in the genre (Among Us, Project
   Zomboid, Stardew Valley, Core Keeper, Hotline Miami, Vampire Survivors,
   etc.) solved the same problem. Don't invent a bespoke solution to an
   already-solved problem.
3. **Mobile-first, always.** This game is played on a phone. No keyboard
   hints ("[E]", "WASD", "Press Space") may ever render on a touch device.
   Gate any desktop-only hint behind `isTouchDevice()`
   (`artifacts/game/src/lib/utils.ts`). Every interaction needs a
   context-sensitive touch affordance, not a translated desktop hint.
4. **No "probably fine."** Mismatched world dimensions, stretched sprites,
   placeholder/joke strings, and inconsistent shadows are not acceptable
   shortcuts — they compound and are exactly what makes a game feel cheap.
5. **Audio must transition, never cut.** Fade in/out and crossfade between
   states (see `artifacts/game/src/game/audio.ts` — music already ramps via
   `linearRampToValueAtTime`; keep this pattern for every new music/ambience
   change, and extend it to SFX layering).
6. **Prefer promoting real world objects over pasting oversized ones.**
   E.g. interactive vehicles should read as part of the same visual system
   as background vehicles (same scale, same shadow treatment), not a
   different asset bolted on top.
7. **Production checklist before calling anything done:**
   - Visual: matches style guide? correct scale? correct perspective/shadow?
   - Gameplay: always works? edge cases tested? can it soft-lock?
   - UI: readable? mobile-first? consistent? clear at a glance?
   - Performance: scales? no lag? reasonable memory?
   - Experience: feels satisfying and premium, not "probably fine"?

   If any answer is no, the feature is not finished.
8. **Use parallel work when the task is genuinely parallelizable** (e.g. a
   visual consistency pass across many sprites, or writing tests across many
   interactions) instead of doing everything serially.

## Known consistency debt (as of July 2026, not yet fixed)

- Vehicle scale/shadow/perspective inconsistency between interactive and
  background cars.
- HUD still described by the owner as cluttered/misaligned despite several
  redesign passes.
- Movement (acceleration/deceleration/turning) lacks the tactile feel of
  reference games — not yet benchmarked against a specific title's feel.
- `replit.md` currently says the "Propaganda Pop" main-menu redesign is
  "not yet graduated," but the live Lobby screen already shows the
  graduated Propaganda Pop style — reconcile that doc before trusting it.

Treat this repository as belonging to a studio with unlimited code review.
Challenge every asset, every UI element, every sound, every animation before
accepting it.
