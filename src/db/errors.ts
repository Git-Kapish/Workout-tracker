/** Every failure that leaves src/db is one of these, so the UI never sees a raw exception. */
export class DbError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DbError';
    this.cause = cause;
  }
}

/** Runs `fn`, converting any non-DbError into a DbError with the original as `cause`. */
export async function guard<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw new DbError(`Database error during ${operation}.`, error);
  }
}
