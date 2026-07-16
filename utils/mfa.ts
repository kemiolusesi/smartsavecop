const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBackupCodes(count = 8, length = 8) {
  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, (byte) => BACKUP_CODE_ALPHABET[byte % BACKUP_CODE_ALPHABET.length]).join('');
  });
}

export async function hashBackupCode(userId: string, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const encoded = new TextEncoder().encode(`${userId}:${normalizedCode}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

