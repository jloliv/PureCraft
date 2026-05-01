# Hero images

Full-bleed lifestyle photos used at the top of the recipe detail screen
(`app/result.tsx` via `<RecipeHero />`).

## Convention

- **Same filename as the thumbnail**, different folder.
  - Thumbnail: `assets/Recipes/stainless-steel-spray.png`
  - Hero:      `assets/hero-images/stainless-steel-spray.png`
- The filename's stem must match the recipe's slug ID exactly. To find a
  recipe's slug, open `constants/launch-recipes-v3.json` and look for the
  `slug` field (when present) or derive it from the title via the rules in
  `constants/recipes.ts > slugifyRecipeId()`.
- After dropping a new file in this folder, register it in
  `constants/recipeHeroImages.ts > RECIPE_HERO_IMAGES`. Metro doesn't
  resolve `require()` paths dynamically, so every entry needs a literal.

## What goes where

| Use                | File              | Composition                                                  |
| ------------------ | ----------------- | ------------------------------------------------------------ |
| Grid thumbnail     | `assets/Recipes/` | Clean product shot, square-ish, transparent or neutral bg.   |
| Hero (this folder) | `assets/hero-images/` | Lifestyle / scene shot. Roughly 16:11 or wider, product is the focal point but the surrounding environment carries the mood. |

The two folders intentionally hold different compositions of the same
recipe — one image cannot serve both a 80×80 thumbnail and a 390×340 hero
without compromising one or the other. Duplication is intentional.

## Fallback behavior

`recipeHeroImage(id)` returns the hero photo if registered, otherwise
falls through to `recipeIcon(id)` so screens never render an empty hero.
This means you can roll heroes out one recipe at a time — the hero screen
always has *something* to show.
