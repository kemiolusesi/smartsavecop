export const SIGNED_URL_EXPIRY_SECONDS = 3600;

export function privateBucketObjectPath(value?: string | null) {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const marker = '/storage/v1/object/';
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      const objectPath = url.pathname.slice(markerIndex + marker.length);
      const withoutAccessPrefix = objectPath.replace(/^(public|sign|authenticated)\//, '');
      const [, ...pathParts] = withoutAccessPrefix.split('/');
      return decodeURIComponent(pathParts.join('/'));
    }
  } catch {
    // Already a storage object path.
  }

  return trimmed.replace(/^\/+/, '');
}

export async function createPrivateBucketSignedUrl(
  supabase: any,
  bucket: string,
  value?: string | null
) {
  const objectPath = privateBucketObjectPath(value);
  if (!objectPath) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    return null;
  }

  return data?.signedUrl || null;
}
