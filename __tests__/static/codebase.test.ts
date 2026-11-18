import fs from 'fs';
import path from 'path';

// Architecture and privacy guards that must keep holding as the app grows.

const ROOT = path.resolve(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = [...sourceFiles(path.join(ROOT, 'app')), ...sourceFiles(path.join(ROOT, 'src'))].map(
  (file) => ({
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    text: fs.readFileSync(file, 'utf8'),
  }),
);

describe('codebase guards', () => {
  it('finds the source files', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('keeps every colour literal inside src/theme (no hard-coded colours in components or screens)', () => {
    const offenders = files
      .filter(({ file }) => !file.startsWith('src/theme/'))
      .filter(({ text }) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('makes no network calls (PRD: fully offline, no analytics)', () => {
    const pattern = /\bfetch\s*\(|XMLHttpRequest|WebSocket|axios|https?:\/\/|navigator\.sendBeacon/;
    const offenders = files.filter(({ text }) => pattern.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('does not use any, ts-ignore or non-null assertions to silence the compiler', () => {
    const pattern = /:\s*any\b|<any>|as any\b|@ts-ignore|@ts-nocheck|\w!\.|\w!\[/;
    const offenders = files.filter(({ text }) => pattern.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('keeps raw SQL inside src/db', () => {
    const sql =
      /\b(SELECT\s.+\sFROM|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+\s+SET|CREATE\s+TABLE)\b/;
    const offenders = files
      .filter(({ file }) => !file.startsWith('src/db/'))
      .filter(({ text }) => sql.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('never stores or parses a workout date through new Date(string) outside dates.ts', () => {
    const offenders = files
      .filter(({ file }) => file !== 'src/lib/dates.ts')
      .filter(({ text }) => /new Date\(\s*['"`]/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
