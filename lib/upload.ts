import { supabaseAdmin } from './supabase';

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized.');
  }
  const client = supabaseAdmin;

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = client.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized.');
  }
  const client = supabaseAdmin;

  const { error } = await client.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}