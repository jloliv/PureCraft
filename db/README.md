# PureCraft database

Supabase Postgres schema + seed for the recipe catalog.

## Files

| File | Purpose |
|---|---|
| `0001_recipes.sql` | Schema — tables, types, RLS, triggers. **Run first.** |
| `seed_recipes.sql` | Idempotent seed. **Auto-generated** from `constants/launch-recipes-v3.json` + the four constants files. Don't edit by hand. |
| `build-seed.mjs` | Regenerates `seed_recipes.sql`. Run after editing any source data file. |

## Tables

```
recipes             — 100 launch-catalog rows (text id, jsonb ingredients/instructions/tags)
recipe_benefits     — 30 hero rows (1:1 fk → recipes); fall back to category copy in app
recipe_shelf_life   — 30 hero rows (1:1 fk → recipes); badges as ENUM[]
retail_overrides    — 30 hero rows (1:1 fk → recipes); per-recipe retail anchors for savings
ingredient_help     — 35 ingredient education entries, keyed by lowercase canonical name
```

## First-time setup

### 1. Configure env vars

Create `.env` (or `.env.local`) at the **project root** (next to `package.json`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Both values come from **Supabase Project Settings → API**:

- **URL** → "Project URL"
- **Anon key** → "Project API keys → anon / public"

The `EXPO_PUBLIC_` prefix is required so Expo's bundler picks them up. Both
values are safe to ship in a built binary — RLS in `0001_recipes.sql` keeps
writes locked down. Never commit the **service role** key — it's not used
client-side.

### 2. Apply the schema

In Supabase Studio → **SQL Editor → New query**, paste the contents of
`db/0001_recipes.sql` and run. Idempotent — safe to re-run later.

Sanity check after applying:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by 1;
-- expect: ingredient_help, recipe_benefits, recipe_shelf_life, recipes,
--         retail_overrides
```

### 3. Seed the catalog

Same SQL Editor. Paste `db/seed_recipes.sql` and run.

```sql
select 'recipes' as t, count(*) from recipes
union all select 'recipe_benefits',   count(*) from recipe_benefits
union all select 'recipe_shelf_life', count(*) from recipe_shelf_life
union all select 'retail_overrides',  count(*) from retail_overrides
union all select 'ingredient_help',   count(*) from ingredient_help;
```

Expected counts:

| t | count |
|---|---:|
| recipes | 100 |
| recipe_benefits | 30 |
| recipe_shelf_life | 30 |
| retail_overrides | 30 |
| ingredient_help | 35 |

### 4. Install the Supabase client

```bash
npx expo install @supabase/supabase-js
```

(Already added to `package.json`; this step just runs the install.)

### 5. Restart the dev server

```bash
npx expo start --clear
```

The `--clear` is important the first time so the env vars get baked in.

You should see no `[supabase]` warnings in the terminal. If you do, double-
check the env-var names start with `EXPO_PUBLIC_` and the file is in the
project root.

## How the app uses it

`constants/recipes.ts` (bundled) is still the **source of truth at boot**.
On every app launch, `constants/recipes-remote.ts` fetches the live catalog
in the background and swaps the in-memory store. Screens that import from
`recipes-remote` and subscribe via `useAllRecipes()` re-render the moment
remote data lands.

Currently no screen imports the remote module — opt in screen-by-screen by
swapping `from '@/constants/recipes'` → `from '@/constants/recipes-remote'`.
The exported API is identical (`ALL_RECIPES` becomes `getAllRecipes()` /
`useAllRecipes()`; everything else is the same shape).

## Re-seeding after editing source data

After editing any of these files:

- `constants/launch-recipes-v3.json`
- `constants/recipe-benefits.ts`
- `constants/recipe-shelf-life.ts`
- `constants/savings.ts` (the `RETAIL_OVERRIDES` block)
- `constants/ingredient-help.ts`

Regenerate the seed and re-apply:

```bash
node db/build-seed.mjs
# Then paste db/seed_recipes.sql into Supabase SQL Editor and run.
```

The seed uses `INSERT ... ON CONFLICT DO UPDATE` so it's idempotent — re-running
won't duplicate rows; it'll just update changed fields.

## Auth, user recipes, and what's next

- `recipes.source` is `catalog | user | ai` so user-created recipes can live
  alongside the launch catalog. RLS already allows authenticated users to
  insert / update / delete their own (`source = 'user'` and
  `author_user_id = auth.uid()`).
- When you wire auth, also wire `lib/supabase.ts` to use AsyncStorage as the
  session adapter on native (currently relies on RN-Web's localStorage shim).
- `ingredient_help.regions` is a JSONB field already shaped for per-region
  shopping sources (Portugal, EU, etc.) when you expand beyond US.
