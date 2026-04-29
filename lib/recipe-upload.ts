// Upload a user-selected image to Supabase Storage and return the public URL.
//
// Usage from a screen:
//   import * as ImagePicker from 'expo-image-picker';
//   const r = await ImagePicker.launchImageLibraryAsync({ ... });
//   if (!r.canceled) {
//     const { url } = await uploadRecipeImage(r.assets[0].uri, recipeId);
//   }
//
// Then store `url` on the recipes row's image_url column.

import { supabase } from './supabase';

export type UploadResult = { url: string | null; error: string | null };

export async function uploadRecipeImage(
  localUri: string,
  recipeId: string,
): Promise<UploadResult> {
  if (!supabase) return { url: null, error: 'Backend not configured' };
  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return { url: null, error: 'Not signed in' };

  // Fetch the local file as a blob (works on RN + web)
  const res = await fetch(localUri);
  const blob = await res.blob();

  // Path: <userId>/<recipeId>-<timestamp>.<ext>
  // Folder must equal auth.uid() to satisfy the RLS policy.
  const ext = guessExt(blob.type ?? '', localUri);
  const path = `${userId}/${recipeId}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('recipe-images')
    .upload(path, blob, {
      cacheControl: '31536000',
      upsert: false,
      contentType: blob.type || 'image/jpeg',
    });
  if (upErr) return { url: null, error: upErr.message };

  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

function guessExt(mime: string, fallbackUri: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  // Fall back to the URI extension if MIME is missing
  const m = fallbackUri.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return m ? m[1].toLowerCase() : 'jpg';
}
