import { decodeExerciseSlug, encodeExerciseSlug } from '@/lib/exerciseRoute';

describe('exercise route slug', () => {
  it('encodes UTF-8 bytes as lowercase hex', () => {
    expect(encodeExerciseSlug('Hi')).toBe('4869');
    expect(encodeExerciseSlug('é')).toBe('c3a9');
    expect(encodeExerciseSlug('')).toBe('');
  });

  it.each([
    'Bench Press',
    'Pull-ups',
    '100% Effort',
    '50% 1RM',
    'Press/Dip?',
    'a#b&c=d',
    '"Quoted" \'name\'',
    'Épaulé',
    'Kettlebell 🏋️ swing',
    '日本語',
    '%41', // looks like an escape but is literal text
    '  spaced  ',
    'a'.repeat(60),
  ])('round-trips %j', (name) => {
    const slug = encodeExerciseSlug(name);
    expect(slug).toMatch(/^[0-9a-f]+$/);
    expect(decodeExerciseSlug(slug)).toBe(name);
  });

  it('survives being percent-decoded any number of times (what the router does)', () => {
    for (const name of ['100% Effort', '%41', 'a b/c?d']) {
      let slug = encodeExerciseSlug(name);
      slug = decodeURIComponent(decodeURIComponent(slug));
      expect(decodeExerciseSlug(slug)).toBe(name);
    }
  });

  it('is only ever URL-safe characters', () => {
    expect(encodeExerciseSlug('a/b?c#d%e f&g')).toMatch(/^[0-9a-f]+$/);
  });

  it.each(['', 'xyz', 'abc', 'ZZ', 'c3', 'ff', '4869 ', 'Hi'])('rejects %j', (slug) => {
    expect(decodeExerciseSlug(slug)).toBeNull();
  });
});
