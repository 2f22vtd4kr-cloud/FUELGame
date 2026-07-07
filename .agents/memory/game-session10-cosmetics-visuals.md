---
name: 95-Y Session 10 — Character Visuals, Pets, Car Skins, Report
description: Session 10 additions: character-specific top-down silhouettes, pets/car skins cosmetics, report button, neutral role ejection text
---

## Character-specific silhouettes (§7.3)
- `drawCharacterDetails(ctx, x, y, character, r)` added in `renderer.ts` just before the facing-dot draw
- Uses `ctx.save()/ctx.restore()` wrapper; no alpha leaks
- Each of the 10 characters has unique visual: Denis=yellow cap arc, Anya=AirPods dots+ponytail, Vova=gold chain+sunglasses strip, Uncle Seryozha=mustache+glasses frames, Petrovich=wrench+oil stain, Marina=ring-light dashed halo+selfie stick, Akhmet=broom diagonal, Oleg=earpiece wire+visor, Lena=helmet arc+tote rect, Barsik=triangular ears+curled tail

## Pets catalog (§3.4)
- `PetDef` type + `PETS` array (11 pets) + `PET_MAP` added to `cosmetics.ts`
- Profile fields: `purchasedPets`, `equippedPet` — defaults `['none']` / `'none'`
- Backwards compat: `loadProfile()` guards for undefined fields in old JSON

## Car skins catalog (§7.2)
- `CarSkinDef` type + `CAR_SKINS` array (9 skins) + `CAR_SKIN_MAP` added to `cosmetics.ts`
- Profile fields: `purchasedCarSkins`, `equippedCarSkin` — defaults `['moskvich_default']` / `'moskvich_default'`
- Car skin `color` field is intended for use in renderer to override car body color (not yet wired to renderer)

## ShopTab rewrite
- Three section tabs: 🧢 Шапки / 🐾 Питомцы / 🚗 Авто
- Shared `ActionButton` helper for equip/buy logic across all three categories
- Stars purchase flow updated to accept `'hat'|'pet'|'car'` itemType

## Report button (§5.6)
- `ReportButton` component added to `GameResults.tsx` (after Play Again)
- Posts to `/api/report` (was originally wrong `/report` — fixed to `/api/report`)
- `report.ts` route logs via pino, mounted at `routes/index.ts`

## Neutral role ejection text
- `getEjectionText()` accepts optional `neutralRole` param
- 'janitor'/'policeman' neutral roles get distinct ejection text
- Call site passes `ejected.neutralRole`

**Why:** These gaps were confirmed missing by code exploration; doc §3.4/§5.6/§7.3 explicitly specify these features.
