---
name: 95-Й Бакстаб production standards reset
description: Owner sent a "reset of expectations" manifesto (July 2026) about quality/process; durable rules now live in docs/PRODUCTION_STANDARDS.md.
---

- The owner's full manifesto is durable project philosophy in
  `docs/PRODUCTION_STANDARDS.md` (referenced from `replit.md`) — read it at
  the start of every session on this project, not just this memory line.
- Core process rule: never fix one isolated thing per session — check scale/
  palette/shadow/interaction consistency with the rest of the game before
  accepting any change. Research proven genre games before inventing new UX.
- Mobile-first is a hard rule now: desktop-only hint text (keyboard legends,
  "[E]"-style prompts meant for a keyboard rather than the on-screen button)
  must never render on a touch device — gate it behind touch detection.
- Known unresolved consistency debt flagged by the owner: vehicle scale/
  shadow mismatch between interactive and background cars, HUD still feels
  cluttered despite multiple redesigns, movement lacks tactile polish vs.
  reference games. These need a design pass — confirm direction with the
  owner before large visual rework rather than guessing at a new art style.
