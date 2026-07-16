export function getAuthErrorMessage(error: unknown): string {
  if (error === '{}' || error === '[object Object]') {
    return 'Signup failed. Please try again or contact support.';
  }
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '[object Object]') {
      return 'Something went wrong. Please try again.';
    }
    return trimmed;
  }
  if (!error) return 'Something went wrong. Please try again.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error_description === 'string') return e.error_description;
    if (typeof e.msg === 'string') return e.msg;
    if (typeof e.error === 'string') return e.error;
  }
  return 'Something went wrong. Please try again.';
}
