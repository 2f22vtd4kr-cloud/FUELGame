---
name: 95-Y doc alignment — daily reward, AI tier %, pathfinding LOD
description: Session fixing §3.5 daily reward amount, §4.2 AI difficulty percentages, §4.5 5Hz far-bot throttling — client/server mirror pattern
---

## Client/server mirror requirement
`artifacts/game/src/game/{types,state,botAI}.ts` and `artifacts/api-server/src/game/{types,state,botAI}.ts`
are near-duplicate implementations (singleplayer vs multiplayer-authoritative). Any bot-AI or
`Player`-shape change must be applied to **both** trees or the two modes silently diverge.

**Why:** Confirmed here — `BOT_DIFFICULTY_SETTINGS` and `moveBot`'s LOD logic existed identically in
both files pre-fix; api-server is not auto-generated from the client, it's hand-mirrored.

## Doc-literal probabilities vs. per-frame rolls
When a design-doc behavior tree says "X% chance" at a decision point (e.g. §4.2 ambush/siphon/sabotage),
that's a **per-opportunity** roll, not a per-frame one. A per-frame roll at 60fps against a tuned-down
probability (e.g. 0.003) is not equivalent and won't match doc-specified odds if someone later asks
"does this match the doc's 30%/80%/etc." Added `siphonDecisionCooldown` / `sabotageDecisionCooldown`
per-bot fields so a failed roll doesn't instantly retry next frame — roll once per opportunity, then
cool down a few seconds before the next roll.

## §4.5 pathfinding LOD has two independent parts
1. Full A* vs. direct-steering fallback based on `NEAR_HUMAN_DIST` (240px ≈ 12m) — this existed already.
2. Position-update-rate throttling (far bots update at 5Hz vs ~20Hz) — this did NOT exist and had to be
   added separately (`botLodAccum` dt-accumulator in `moveBot`, gates `_moveDirect` calls to ≥0.2s apart).
Don't assume part 1 implies part 2 — they're described as two separate optimizations in the doc.
