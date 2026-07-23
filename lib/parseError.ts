export function parseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.toLowerCase();

  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('net::err')
  ) {
    return 'Please check your internet connection and try again.';
  }

  if (
    msg.includes('json') ||
    msg.includes('unexpected token') ||
    msg.includes('unexpected end') ||
    msg.includes('syntaxerror')
  ) {
    return 'There was a connection problem. Please check your internet and try again.';
  }

  if (
    msg.includes('500') ||
    msg.includes('internal server error') ||
    msg.includes('bad gateway') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  ) {
    return 'Our server is temporarily unavailable. Please wait a moment and try again.';
  }

  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  if (
    msg.includes('jwt') ||
    msg.includes('unauthorized') ||
    msg.includes('not authenticated') ||
    msg.includes('session')
  ) {
    return 'Your session has expired. Please sign in again.';
  }

  if (
    msg.includes('column') ||
    msg.includes('schema') ||
    msg.includes('relation') ||
    msg.includes('violates')
  ) {
    return 'Something went wrong on our end. Please try again or contact support.';
  }

  if (
    typeof raw === 'string' &&
    raw.trim() &&
    raw.trim() !== '{}' &&
    raw.trim() !== '[object Object]' &&
    !msg.includes('error:')
  ) {
    return raw.trim();
  }

  return 'Something went wrong. Please try again. If the problem continues, contact support.';
}
