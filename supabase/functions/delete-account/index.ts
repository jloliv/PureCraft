// delete-account — fully deletes the calling user's account.
//
// Why an Edge Function: deleting from auth.users requires the service role
// key, which cannot ship in the mobile bundle. The function authenticates
// the caller via the JWT they send, then uses service-role to delete.
//
// Cascade: all per-user tables (user_profiles, saved_recipes, user-authored
// recipes) have ON DELETE CASCADE on the auth.users FK, so removing the
// auth row cleans everything in one shot.
//
// Required env (Supabase auto-injects these in deployed functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Deploy:
//   supabase functions deploy delete-account

// @ts-expect-error — deno standard library, not in node_modules
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
// @ts-expect-error — esm.sh deno-compatible build
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

import { corsHeaders, preflight } from '../_shared/cors.ts';

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

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) {
    return jsonResponse({ error: 'Server not configured' }, 500);
  }

  // Verify the caller via their JWT (sent in Authorization header).
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing bearer token' }, 401);
  }
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse({ error: 'Invalid session' }, 401);
  }
  const userId = userData.user.id;

  // Use service role to drop the user. Cascades wipe profile + saves +
  // user-authored recipes via FK ON DELETE CASCADE.
  const admin = createClient(url, serviceKey);
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    return jsonResponse({ error: delErr.message }, 500);
  }

  return jsonResponse({ ok: true });
});
