// The only thing the repository and migration runner know about the database. The app
// implements it with expo-sqlite (client.ts); tests implement it with better-sqlite3.

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SqlExecutor {
  /** Runs one or more statements with no parameters (DDL, PRAGMA). */
  exec(sql: string): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Commits if `fn` resolves, rolls back (and rethrows) if it rejects. Not re-entrant. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
