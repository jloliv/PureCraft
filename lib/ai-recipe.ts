// Client-side wrapper around the `generate-recipe` Edge Function.
//
// Pattern: call → returns the parsed recipe + caller decides whether to
// preview, save, or discard. We keep the saving step explicit so the user
// can edit the AI output before it lands in their `recipes` row.

import { events } from './analytics';
import { supabase } from './supabase';
import { useProfile } from './profile';

export type GeneratedRecipe = {
  title: string;
  category_key: string;
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

export async function generateRecipe(
  prompt: string,
  profileFields?: {
    household?: string[];
    avoidances?: string[];
    scent_preferences?: string[];
    priorities?: string[];
    intent_categories?: string[];
  },
): Promise<{ recipe: GeneratedRecipe | null; error: string | null }> {
  if (!supabase) return { recipe: null, error: 'Backend not configured' };
  events.aiGenerationRequested(prompt.length);
  const { data, error } = await supabase.functions.invoke<{
    recipe?: GeneratedRecipe;
    error?: string;
  }>('generate-recipe', {
    body: { prompt, profile: profileFields ?? {} },
  });
  if (error) {
    events.aiGenerationFailed(error.message);
    return { recipe: null, error: error.message };
  }
  if (!data?.recipe) {
    const msg = data?.error ?? 'No recipe returned';
    events.aiGenerationFailed(msg);
    return { recipe: null, error: msg };
  }
  return { recipe: data.recipe, error: null };
}

// Convenience: generate AND insert into the user's library in one go.
export async function generateAndSave(
  prompt: string,
  profileFields?: Parameters<typeof generateRecipe>[1],
): Promise<{ recipeId: string | null; error: string | null }> {
  const { recipe, error } = await generateRecipe(prompt, profileFields);
  if (error || !recipe) return { recipeId: null, error };
  if (!supabase) return { recipeId: null, error: 'Backend not configured' };

  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return { recipeId: null, error: 'Not signed in' };

  const id = `ai_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
  const { error: insErr } = await supabase.from('recipes').insert({
    id,
    title: recipe.title,
    category_label: recipe.category_label,
    // The DB enum is the type-safe truth here; cast and let RLS reject
    // anything off-schema.
    category_key: recipe.category_key as
      | 'cleaning'
      | 'laundry'
      | 'beauty-skincare'
      | 'hair-care'
      | 'baby-family-safe'
      | 'home-air-freshening'
      | 'pet-safe'
      | 'garden-outdoor'
      | 'seasonal-holiday'
      | 'emergency-budget-hacks',
    difficulty: recipe.difficulty,
    time_label: recipe.time_label,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    safe_for_kids: recipe.safe_for_kids,
    cost_savings: recipe.cost_savings,
    tags: recipe.tags,
    source: 'ai',
    author_user_id: userId,
    is_published: true,
  });
  if (insErr) {
    events.aiGenerationFailed(insErr.message);
    return { recipeId: null, error: insErr.message };
  }
  events.aiGenerationCompleted(id);
  return { recipeId: id, error: null };
}

// Convenience hook: pulls profile from context and binds it to generation.
export function useAiGenerator() {
  const { profile } = useProfile();
  const profileFields = profile
    ? {
        household: profile.household,
        avoidances: profile.avoidances,
        scent_preferences: profile.scent_preferences,
        priorities: profile.priorities,
        intent_categories: profile.intent_categories,
      }
    : undefined;
  return {
    generate: (prompt: string) => generateRecipe(prompt, profileFields),
    generateAndSave: (prompt: string) => generateAndSave(prompt, profileFields),
  };
}
