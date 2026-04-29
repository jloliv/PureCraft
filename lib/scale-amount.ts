// Multiply ingredient amounts cleanly. Handles every form the catalog uses:
//   "1 cup"           → "3 cups"-equivalent ("3 cup")
//   "1/2 cup"         → "1 cup"  (× 2)
//   "1 ½ cups"        → "4 ½ cups" (× 3)  via unicode + mixed form
//   "10 drops"        → "30 drops"
//   "from 2 lemons"   → "from 4 lemons"   (leading prefix preserved)
//   "water as needed" → unchanged (no leading number)
//   "Undiluted white vinegar" → unchanged
//
// We deliberately don't try to pluralize ("cup" → "cups"); that's a copy
// problem in the source data and not worth the brittleness.

const UNICODE_FRAC: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

const UF_KEYS = Object.keys(UNICODE_FRAC).join('');

type Parsed = {
  prefix: string; // text before the number (e.g. "from ")
  value: number;
  rest: string; // unit + descriptor after the number
};

// Match "from", "about", "approximately" etc. as a prefix that we should
// keep in front of the scaled number.
const PREFIX_RE = /^\s*(from|about|approx\.?|approximately|over)\s+/i;

function parseLeading(s: string): Parsed | null {
  let prefix = '';
  let work = s;

  const pm = work.match(PREFIX_RE);
  if (pm) {
    prefix = pm[0];
    work = work.slice(pm[0].length);
  }

  // Mixed: "1 1/2"
  let m = work.match(/^\s*(\d+)\s+(\d+)\/(\d+)\b/);
  if (m) {
    const v = Number(m[1]) + Number(m[2]) / Number(m[3]);
    return { prefix, value: v, rest: work.slice(m[0].length) };
  }
  // Mixed unicode: "1 ½"
  m = work.match(new RegExp('^\\s*(\\d+)\\s*([' + UF_KEYS + '])'));
  if (m) {
    return {
      prefix,
      value: Number(m[1]) + UNICODE_FRAC[m[2]],
      rest: work.slice(m[0].length),
    };
  }
  // Bare fraction: "1/2"
  m = work.match(/^\s*(\d+)\/(\d+)\b/);
  if (m) {
    return {
      prefix,
      value: Number(m[1]) / Number(m[2]),
      rest: work.slice(m[0].length),
    };
  }
  // Bare unicode fraction: "½"
  m = work.match(new RegExp('^\\s*([' + UF_KEYS + '])'));
  if (m) {
    return { prefix, value: UNICODE_FRAC[m[1]], rest: work.slice(m[0].length) };
  }
  // Decimal: "1.5" / "10"
  m = work.match(/^\s*(\d+(?:\.\d+)?)\b/);
  if (m) {
    return { prefix, value: Number(m[1]), rest: work.slice(m[0].length) };
  }
  return null;
}

const FRACTIONS: { value: number; str: string }[] = [
  { value: 0.125, str: '⅛' },
  { value: 0.25, str: '¼' },
  { value: 1 / 3, str: '⅓' },
  { value: 0.375, str: '⅜' },
  { value: 0.5, str: '½' },
  { value: 0.625, str: '⅝' },
  { value: 2 / 3, str: '⅔' },
  { value: 0.75, str: '¾' },
  { value: 0.875, str: '⅞' },
];

function formatValue(n: number): string {
  if (n <= 0) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  const whole = Math.floor(n);
  const frac = n - whole;
  let best = FRACTIONS[0];
  let bestErr = Math.abs(frac - best.value);
  for (const c of FRACTIONS) {
    const err = Math.abs(frac - c.value);
    if (err < bestErr) {
      best = c;
      bestErr = err;
    }
  }
  if (bestErr < 0.04) {
    return whole > 0 ? `${whole} ${best.str}` : best.str;
  }
  // Fall back to a clean decimal (no trailing zeroes).
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export function scaleAmount(amount: string, factor: number): string {
  if (!amount || factor === 1) return amount;
  const parsed = parseLeading(amount);
  if (!parsed) return amount;
  const scaled = parsed.value * factor;
  return `${parsed.prefix}${formatValue(scaled)}${parsed.rest}`;
}

export function isAmountScalable(amount: string): boolean {
  return parseLeading(amount) !== null;
}
