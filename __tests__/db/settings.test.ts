/** @jest-environment node */
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository, WELCOME_SEEN_KEY } from '@/db/settings';
import { createTestExecutor } from '../helpers/sqliteExecutor';

async function setup() {
  const db = createTestExecutor();
  await runMigrations(db);
  return createSettingsRepository(db);
}

describe('settings repository', () => {
  it('returns null for a setting that was never written', async () => {
    const settings = await setup();
    expect(await settings.get(WELCOME_SEEN_KEY)).toBeNull();
  });

  it('stores and overwrites a value (one row per key)', async () => {
    const settings = await setup();
    await settings.set(WELCOME_SEEN_KEY, '1');
    expect(await settings.get(WELCOME_SEEN_KEY)).toBe('1');
    await settings.set(WELCOME_SEEN_KEY, '0');
    expect(await settings.get(WELCOME_SEEN_KEY)).toBe('0');
  });

  it('keeps keys independent and stores awkward values verbatim', async () => {
    const settings = await setup();
    await settings.set('a', `it's "quoted"; --`);
    await settings.set('b', '2');
    expect(await settings.get('a')).toBe(`it's "quoted"; --`);
    expect(await settings.get('b')).toBe('2');
  });
});
