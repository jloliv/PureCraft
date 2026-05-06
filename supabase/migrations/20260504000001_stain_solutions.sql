-- Stain solutions schema. Mirrors constants/stain-solutions.ts 1:1 so
-- the local-first dataset can be lifted into Supabase as soon as the
-- product wants to author stains without redeploying the app.
--
-- Five tables instead of one JSON column because:
--   * stain_aliases drives ILIKE search ("blood", "red wine", "pen")
--   * stain_surfaces drives "where is it?" filtering
--   * stain_steps preserves order without fragile JSON-array indexing
--   * stain_avoid keeps warnings as discrete rows for future per-row
--     metadata (severity, surface-specific guidance, etc.)
--
-- Apply with: `npx supabase db push` (or paste into the Supabase SQL
-- editor for one-off application).

-- ============================== Core ==================================
CREATE TABLE IF NOT EXISTS public.stain_solutions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (
    category IN ('protein', 'tannin', 'oil', 'organic', 'chemical')
  ),
  urgency     TEXT NOT NULL CHECK (urgency IN ('immediate', 'normal')),
  recipe_id   TEXT REFERENCES public.recipes(id) ON DELETE SET NULL,
  -- Original spec id, kept so a future content pass can author the
  -- dedicated recipe and update recipe_id without losing provenance.
  spec_recipe_id TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================== Aliases ===============================
CREATE TABLE IF NOT EXISTS public.stain_aliases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id    TEXT NOT NULL REFERENCES public.stain_solutions(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  UNIQUE (stain_id, alias)
);
-- ILIKE-friendly index for the search-fallback path.
CREATE INDEX IF NOT EXISTS stain_aliases_alias_lower_idx
  ON public.stain_aliases (LOWER(alias));

-- ============================== Surfaces ==============================
CREATE TABLE IF NOT EXISTS public.stain_surfaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id    TEXT NOT NULL REFERENCES public.stain_solutions(id) ON DELETE CASCADE,
  surface     TEXT NOT NULL CHECK (
    surface IN ('fabric', 'carpet', 'upholstery', 'hard-surface')
  ),
  UNIQUE (stain_id, surface)
);
CREATE INDEX IF NOT EXISTS stain_surfaces_surface_idx
  ON public.stain_surfaces (surface);

-- ============================== Avoid =================================
CREATE TABLE IF NOT EXISTS public.stain_avoid (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id    TEXT NOT NULL REFERENCES public.stain_solutions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL
);

-- ============================== Steps =================================
CREATE TABLE IF NOT EXISTS public.stain_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id    TEXT NOT NULL REFERENCES public.stain_solutions(id) ON DELETE CASCADE,
  step_order  INT NOT NULL,
  text        TEXT NOT NULL,
  UNIQUE (stain_id, step_order)
);

-- ============================== RLS ==================================
-- Read-only for everyone; writes locked down to the service role.
-- Same pattern as the recipes table.
ALTER TABLE public.stain_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stain_aliases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stain_surfaces  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stain_avoid     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stain_steps     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stain_solutions read"
  ON public.stain_solutions FOR SELECT
  USING (is_published = TRUE);
CREATE POLICY "stain_aliases read"
  ON public.stain_aliases FOR SELECT
  USING (TRUE);
CREATE POLICY "stain_surfaces read"
  ON public.stain_surfaces FOR SELECT
  USING (TRUE);
CREATE POLICY "stain_avoid read"
  ON public.stain_avoid FOR SELECT
  USING (TRUE);
CREATE POLICY "stain_steps read"
  ON public.stain_steps FOR SELECT
  USING (TRUE);

-- ============================== Seed ==================================
-- Mirrors constants/stain-solutions.ts so the remote and bundled
-- catalogs match on apply. Future content edits should be made here
-- (then sync down to the constants file) once Supabase is the source
-- of truth.

INSERT INTO public.stain_solutions
  (id, name, emoji, category, urgency, recipe_id, spec_recipe_id) VALUES
  ('blood',  'Blood Stain',   '🩸', 'protein',  'immediate', 'stain-stick',     'cold-water-blood-remover'),
  ('sweat',  'Sweat Stain',   '💦', 'protein',  'normal',    'sportswear-wash', 'fabric-deodorizing-wash'),
  ('wine',   'Wine Stain',    '🍷', 'tannin',   'immediate', 'stain-stick',     'wine-stain-lift'),
  ('coffee', 'Coffee Stain',  '☕', 'tannin',   'normal',    'stain-stick',     'coffee-stain-remover'),
  ('grease', 'Grease Stain',  '🛢️', 'oil',      'normal',    'grease-cutter',   'grease-cutter'),
  ('makeup', 'Makeup Stain',  '💄', 'oil',      'normal',    'delicate-wash',   'gentle-fabric-cleaner'),
  ('grass',  'Grass Stain',   '🌿', 'organic',  'normal',    'stain-stick',     'fabric-stain-remover'),
  ('mud',    'Mud Stain',     '🟤', 'organic',  'normal',    'all-purpose-spray', 'all-purpose-cleaner'),
  ('ink',    'Ink Stain',     '🖊️', 'chemical', 'immediate', 'stain-stick',     'ink-remover')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stain_aliases (stain_id, alias) VALUES
  ('blood',  'blood'),  ('blood',  'cut'),    ('blood',  'injury'),
  ('sweat',  'sweat'),  ('sweat',  'underarm stain'), ('sweat', 'pit stain'),
  ('wine',   'wine'),   ('wine',   'red wine'), ('wine',  'juice'),
  ('coffee', 'coffee'), ('coffee', 'tea'),
  ('grease', 'oil'),    ('grease', 'butter'), ('grease', 'cooking grease'), ('grease', 'food oil'),
  ('makeup', 'foundation'), ('makeup', 'cosmetics'), ('makeup', 'lipstick'),
  ('grass',  'grass'),  ('grass',  'outdoor stain'), ('grass', 'lawn'),
  ('mud',    'dirt'),   ('mud',    'soil'),  ('mud', 'mud'),
  ('ink',    'pen'),    ('ink',    'marker'), ('ink', 'ink')
ON CONFLICT (stain_id, alias) DO NOTHING;

INSERT INTO public.stain_surfaces (stain_id, surface) VALUES
  ('blood', 'fabric'), ('blood', 'carpet'), ('blood', 'upholstery'),
  ('sweat', 'fabric'),
  ('wine', 'fabric'), ('wine', 'carpet'), ('wine', 'upholstery'),
  ('coffee', 'fabric'), ('coffee', 'carpet'),
  ('grease', 'fabric'), ('grease', 'carpet'),
  ('makeup', 'fabric'),
  ('grass', 'fabric'),
  ('mud', 'fabric'), ('mud', 'carpet'),
  ('ink', 'fabric')
ON CONFLICT (stain_id, surface) DO NOTHING;

INSERT INTO public.stain_avoid (stain_id, text) VALUES
  ('blood',  'Hot water — it sets the stain'),
  ('sweat',  'High heat drying before cleaning'),
  ('wine',   'Heat before removal — it locks the color in'),
  ('coffee', 'Letting the stain set without treatment'),
  ('grease', 'Applying water first — it spreads the oil'),
  ('makeup', 'Rubbing aggressively — it embeds the pigment'),
  ('grass',  'Delaying treatment too long'),
  ('mud',    'Cleaning while wet — wait for it to dry first'),
  ('ink',    'Rubbing — it spreads the ink');

INSERT INTO public.stain_steps (stain_id, step_order, text) VALUES
  -- Blood
  ('blood', 1, 'Rinse with cold water immediately'),
  ('blood', 2, 'Apply hydrogen peroxide or salt paste'),
  ('blood', 3, 'Blot gently — do not rub'),
  ('blood', 4, 'Repeat until stain lifts'),
  -- Sweat
  ('sweat', 1, 'Apply baking soda paste'),
  ('sweat', 2, 'Let sit for 30 minutes'),
  ('sweat', 3, 'Scrub lightly'),
  ('sweat', 4, 'Wash with warm water'),
  -- Wine
  ('wine', 1, 'Blot immediately'),
  ('wine', 2, 'Apply salt or baking soda'),
  ('wine', 3, 'Add vinegar solution'),
  ('wine', 4, 'Rinse with cold water'),
  -- Coffee
  ('coffee', 1, 'Blot excess liquid'),
  ('coffee', 2, 'Apply vinegar and water solution'),
  ('coffee', 3, 'Blot again'),
  ('coffee', 4, 'Rinse and repeat if needed'),
  -- Grease
  ('grease', 1, 'Apply baking soda or cornstarch'),
  ('grease', 2, 'Let sit to absorb the oil'),
  ('grease', 3, 'Brush off the powder'),
  ('grease', 4, 'Apply dish soap and rinse'),
  -- Makeup
  ('makeup', 1, 'Blot excess product'),
  ('makeup', 2, 'Apply dish soap'),
  ('makeup', 3, 'Gently scrub'),
  ('makeup', 4, 'Rinse with warm water'),
  -- Grass
  ('grass', 1, 'Apply vinegar solution'),
  ('grass', 2, 'Scrub gently'),
  ('grass', 3, 'Rinse with cold water'),
  ('grass', 4, 'Repeat if needed'),
  -- Mud
  ('mud', 1, 'Let mud dry completely'),
  ('mud', 2, 'Brush off excess dirt'),
  ('mud', 3, 'Apply cleaning solution'),
  ('mud', 4, 'Rinse and blot'),
  -- Ink
  ('ink', 1, 'Place a clean cloth under the stain'),
  ('ink', 2, 'Apply rubbing alcohol'),
  ('ink', 3, 'Blot from outside inward'),
  ('ink', 4, 'Repeat until removed')
ON CONFLICT (stain_id, step_order) DO NOTHING;
