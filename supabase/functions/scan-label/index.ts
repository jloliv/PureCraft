// scan-label — reads a product label image with Claude Vision and returns
// structured fields the client uses to match against the recipes catalog.
//
// Why Claude Vision (not ML Kit / Tesseract):
//  - Works in Expo Go (no native module / dev build required)
//  - Handles messy real-world labels, multiple languages, partial text
//  - Returns *semantic* output (canonical ingredient names) instead of a
//    raw OCR string — makes matching dramatically more reliable
//  - One Anthropic key powers AI generation AND scanning (already configured)
//
// Required secret: ANTHROPIC_API_KEY (already set in earlier setup).
//
// Deploy: supabase functions deploy scan-label
// Invoke from client:
//   const { data } = await supabase.functions.invoke('scan-label', {
//     body: { image_base64: '<jpeg base64>' }
//   });

// @ts-expect-error — deno standard library
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

import { corsHeaders, preflight } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-3-5-sonnet-latest';

type ScanBody = { image_base64?: string; mime?: string };

type ScanResult = {
  brand: string | null;
  product_name: string | null;
  product_type:
    | 'cleaning'
    | 'beauty'
    | 'home'
    | 'laundry'
    | 'unknown';
  // Canonical lowercase ingredient names — already normalized for matching.
  ingredients: string[];
  // Confidence 0–1 in the OCR step itself (separate from recipe match).
  ocr_confidence: number;
  // True if the model couldn't read enough to be useful.
  unreadable: boolean;
  // Human-readable note if unreadable=true (e.g. "blurry image").
  reason?: string;
};

const SYSTEM_PROMPT = `You are PureCraft's product-label reader. The user
photographs the BACK of a household product (cleaning spray, lotion,
shampoo, candle, laundry detergent, etc.) where the ingredients are listed.
You extract the ingredients section and return structured data.

Hard rules:
1. Output VALID JSON ONLY — no prose, no markdown fences.
2. INGREDIENT EXTRACTION (most important):
   - Find the section beginning with "Ingredients:", "Ingredients", "INGREDIENTS",
     "Contains:", "Composition:", or any equivalent in another language
     ("Ingrédients", "Inhaltsstoffe", "Ingredientes", etc.).
   - Extract everything after that header until you hit another section
     (Directions, Warnings, Cautions, Storage, Net Wt, etc.).
   - Split the resulting block on commas, periods, slashes, and newlines.
   - If you cannot find an explicit ingredients section ANYWHERE on the
     visible label, set ingredients: [] and unreadable: true with reason
     "no_ingredients_section". Do NOT guess from the front label.
3. Canonicalize each ingredient. Drop concentrations and INCI parens.
   Examples: "AQUA / WATER" → "water", "Sodium Lauryl Sulfate (SLS)" →
   "sodium lauryl sulfate", "Citrus aurantium dulcis (Orange) Peel Oil" →
   "orange peel oil", "Parfum/Fragrance" → "fragrance".
4. Lowercase every ingredient. Singular form ("oil" not "oils").
5. Include up to 25 ingredients. Top of list = most concentrated.
6. product_type must be one of: cleaning, beauty, home, laundry, unknown.
7. ocr_confidence: 0.0 if unreadable, 1.0 if every ingredient is crystal-clear.
8. unreadable: true if any of these are true:
   - Image is blurry, too dark, or shows no label
   - You see a label but cannot find an ingredients section
   - Image shows only the front of a product (no ingredients visible)
   In each case set a short reason: "blurry", "no_label", "front_label_only",
   "no_ingredients_section", or "too_dark".`;

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

  let body: ScanBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.image_base64 || typeof body.image_base64 !== 'string') {
    return jsonResponse({ error: 'Missing image_base64' }, 400);
  }
  // 6 MB ceiling — Claude tops out around 5 MB encoded.
  if (body.image_base64.length > 8_000_000) {
    return jsonResponse({ error: 'Image too large — resize to <2MB' }, 413);
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
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: body.mime ?? 'image/jpeg',
                data: body.image_base64,
              },
            },
            {
              type: 'text',
              text: `Read this product label. Respond with ONLY this JSON shape:
{
  "brand": "string or null",
  "product_name": "string or null",
  "product_type": "cleaning | beauty | home | laundry | unknown",
  "ingredients": ["water", "..."],
  "ocr_confidence": 0.0,
  "unreadable": false,
  "reason": "optional one-sentence reason if unreadable"
}`,
            },
          ],
        },
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
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let result: ScanResult;
  try {
    result = JSON.parse(cleaned);
  } catch {
    return jsonResponse(
      { error: 'Model returned non-JSON', raw: text.slice(0, 500) },
      502,
    );
  }

  return jsonResponse({ result });
});
