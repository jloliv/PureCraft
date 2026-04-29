// generate-recipe — calls Claude with the user's prompt + profile, returns
// a structured recipe object that the client can save into `recipes`.
//
// Why an Edge Function: the Anthropic API key cannot ship in the mobile
// bundle. We proxy through Supabase so the key stays server-side, and we
// can also enforce auth + rate limiting per user.
//
// Required secret: ANTHROPIC_API_KEY (set via `supabase secrets set`).
//
// Deploy:
//   supabase functions deploy generate-recipe
//
// Invoke from client:
//   const { data } = await supabase.functions.invoke('generate-recipe', {
//     body: { prompt: 'lavender linen spray', profile: {...} }
//   });

// @ts-expect-error — deno standard library, not in node_modules
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

import { corsHeaders, preflight } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-3-5-sonnet-latest';

type GenerateBody = {
  prompt: string;
  profile?: {
    household?: string[];
    avoidances?: string[];
    scent_preferences?: string[];
    priorities?: string[];
    intent_categories?: string[];
  };
};

type GeneratedRecipe = {
  title: string;
  category_key:
    | 'cleaning'
    | 'laundry'
    | 'beauty-skincare'
    | 'hair-care'
    | 'baby-family-safe'
    | 'home-air-freshening'
    | 'pet-safe'
    | 'garden-outdoor'
    | 'seasonal-holiday'
    | 'emergency-budget-hacks';
  category_label: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_label: string;
  ingredients: string[];
  instructions: string[];
  safe_for_kids: boolean;
  cost_savings: string;
  tags: string[];
  notes: string;
};

const SYSTEM_PROMPT = `You are PureCraft's recipe creator. You design safe, simple,
budget-friendly DIY household recipes (cleaning sprays, laundry boosters, body
butters, room sprays, hair care, etc.) for everyday people.

Hard rules:
1. Output VALID JSON ONLY — no prose, no markdown fences. The JSON must match
   the shape provided in the user's request.
2. Ingredients must be common pantry/grocery items (vinegar, baking soda,
   castile soap, essential oils, distilled water, etc.). Never recommend lye,
   industrial chemicals, or anything dangerous to inhale or touch.
3. Honor the user's avoidances list strictly — if they avoid "fragrance",
   don't include essential oils. If they avoid "tea tree", never use it.
4. If the household includes "baby" or "young", you MUST set safe_for_kids: true
   and avoid eucalyptus, tea tree, peppermint (>1%), and any essential-oil
   ratio above 0.5%.
5. If the household includes "pets", avoid tea tree, eucalyptus, and citrus oils.
6. Keep ingredients ≤ 6, instructions ≤ 6 short numbered steps.
7. Estimate cost_savings vs. store-bought as "$X saved" (single dollar number).
8. Choose category_key from the enum exactly. category_label is the human form.
9. tags: 2–4 short lowercase strings ("spray", "non-toxic", "5-min", "pet-safe").
10. time_label like "5 min" or "10 min".`;

const USER_TEMPLATE = (
  prompt: string,
  profile: GenerateBody['profile'],
) => `Create one DIY recipe based on this request: "${prompt}"

User context (honor these):
- Household: ${(profile?.household ?? []).join(', ') || 'unspecified'}
- Avoidances: ${(profile?.avoidances ?? []).join(', ') || 'none'}
- Scent preferences: ${(profile?.scent_preferences ?? []).join(', ') || 'no preference'}
- Priorities: ${(profile?.priorities ?? []).join(', ') || 'general'}
- Intent categories: ${(profile?.intent_categories ?? []).join(', ') || 'any'}

Respond with JSON in EXACTLY this shape:
{
  "title": "string (max 40 chars)",
  "category_key": "one of: cleaning, laundry, beauty-skincare, hair-care, baby-family-safe, home-air-freshening, pet-safe, garden-outdoor, seasonal-holiday, emergency-budget-hacks",
  "category_label": "human-readable category",
  "difficulty": "Easy | Medium | Hard",
  "time_label": "X min",
  "ingredients": ["1 cup distilled water", "..."],
  "instructions": ["Combine ...", "..."],
  "safe_for_kids": boolean,
  "cost_savings": "$X saved",
  "tags": ["spray", "non-toxic"],
  "notes": "1-2 sentence usage tip"
}`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
  if (!ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: 'ANTHROPIC_API_KEY not configured on the server' },
      500,
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.prompt || typeof body.prompt !== 'string') {
    return jsonResponse({ error: 'Missing prompt' }, 400);
  }
  if (body.prompt.length > 500) {
    return jsonResponse({ error: 'Prompt too long (500 chars max)' }, 400);
  }

  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: USER_TEMPLATE(body.prompt, body.profile) },
      ],
    }),
  });

  if (!apiRes.ok) {
    const text = await apiRes.text();
    return jsonResponse(
      { error: `Anthropic API ${apiRes.status}: ${text.slice(0, 200)}` },
      502,
    );
  }

  const apiJson = await apiRes.json();
  const text: string = apiJson?.content?.[0]?.text ?? '';
  // Claude is good but occasionally wraps JSON in fences; strip them.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let recipe: GeneratedRecipe;
  try {
    recipe = JSON.parse(cleaned);
  } catch {
    return jsonResponse(
      { error: 'Model returned non-JSON', raw: text.slice(0, 500) },
      502,
    );
  }

  return jsonResponse({ recipe });
});
