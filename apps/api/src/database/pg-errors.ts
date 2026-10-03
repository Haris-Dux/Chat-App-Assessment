export const PgErrorCode = {
  UniqueViolation: '23505',
  ForeignKeyViolation: '23503',
  ExclusionViolation: '23P01',
} as const;

export function pgErrorCode(error: unknown): string | undefined {
  const cause = error instanceof Error && error.cause ? error.cause : error;

  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    return String(cause.code);
  }

  return undefined;
}
