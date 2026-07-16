export function toErrorMessage(value: unknown, fallback = 'An unexpected error occurred') {
  if (value instanceof Error && value.message.trim()) return value.message;

  if (typeof value === 'string' && value.trim()) return value.trim();

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidates = [record.message, record.error_description, record.details, record.hint, record.code, record.status];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
      if (typeof candidate === 'number') return String(candidate);
    }

    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // Ignore serialization failures and use the fallback below.
    }
  }

  return fallback;
}

export function toOptionalErrorMessage(value: unknown, fallback = 'An unexpected error occurred') {
  if (!value) return '';
  return toErrorMessage(value, fallback);
}
