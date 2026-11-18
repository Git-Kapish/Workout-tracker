import { normalizeExerciseName, parseWeightInput, validateEntryInput } from '@/lib/validation';
import type { RawEntryInput } from '@/lib/validation';

const valid: RawEntryInput = {
  exerciseName: 'Bench Press',
  sets: '3',
  reps: '10',
  weight: '42.5',
  date: '2026-11-17',
};

describe('normalizeExerciseName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeExerciseName('  Bench   Press \t')).toBe('Bench Press');
    expect(normalizeExerciseName('Bench\n Press')).toBe('Bench Press');
  });
});

describe('parseWeightInput', () => {
  it.each([
    ['42.5', 42.5],
    ['42,5', 42.5],
    ['65', 65],
    ['0', 0],
    ['.5', 0.5],
    ['42.', 42],
    [' 42.5 ', 42.5],
    ['1000', 1000],
  ])('accepts %j as %d', (raw, expected) => {
    expect(parseWeightInput(raw)).toEqual({ ok: true, value: expected });
  });

  it('treats blank as null (bodyweight)', () => {
    expect(parseWeightInput('')).toEqual({ ok: true, value: null });
    expect(parseWeightInput('   ')).toEqual({ ok: true, value: null });
  });

  it.each([
    '-5',
    '-0.5',
    'abc',
    '12kg',
    '1,000.5',
    '1.2.3',
    '4,5,6',
    '1e3',
    'NaN',
    'Infinity',
    '0x10',
    '+5',
  ])('rejects %j', (raw) => {
    expect(parseWeightInput(raw).ok).toBe(false);
  });

  it('rejects absurdly large values and too many decimals', () => {
    expect(parseWeightInput('1000.01').ok).toBe(false);
    expect(parseWeightInput('99999').ok).toBe(false);
    expect(parseWeightInput('42.555').ok).toBe(false);
    expect(parseWeightInput('42.55')).toEqual({ ok: true, value: 42.55 });
  });
});

describe('validateEntryInput', () => {
  it('accepts valid input and returns a normalized NewEntry', () => {
    expect(validateEntryInput({ ...valid, exerciseName: '  Bench   Press ' })).toEqual({
      ok: true,
      value: { exerciseName: 'Bench Press', sets: 3, reps: 10, weightKg: 42.5, date: '2026-11-17' },
    });
  });

  it('accepts a comma decimal and blank weight', () => {
    const comma = validateEntryInput({ ...valid, weight: '42,5' });
    expect(comma.ok && comma.value.weightKg).toBe(42.5);
    const blank = validateEntryInput({ ...valid, weight: '' });
    expect(blank.ok && blank.value.weightKg).toBeNull();
  });

  const errorsOf = (over: Partial<RawEntryInput>) => {
    const r = validateEntryInput({ ...valid, ...over });
    return r.ok ? null : r.errors;
  };

  it('rejects empty and whitespace-only names', () => {
    expect(errorsOf({ exerciseName: '' })?.exerciseName).toBeDefined();
    expect(errorsOf({ exerciseName: '    ' })?.exerciseName).toBeDefined();
  });

  it('enforces the 60 character name limit after normalising', () => {
    expect(errorsOf({ exerciseName: 'a'.repeat(60) })).toBeNull();
    expect(errorsOf({ exerciseName: 'a'.repeat(61) })?.exerciseName).toBeDefined();
    expect(errorsOf({ exerciseName: `${'a'.repeat(60)}      ` })).toBeNull();
  });

  it.each(['0', '-1', '2.5', 'abc', '', '51', '1e1', '3,5'])('rejects sets %j', (sets) => {
    expect(errorsOf({ sets })?.sets).toBeDefined();
  });

  it.each(['0', '-3', '8.5', 'x', '', '1001'])('rejects reps %j', (reps) => {
    expect(errorsOf({ reps })?.reps).toBeDefined();
  });

  it('accepts the limits', () => {
    expect(errorsOf({ sets: '50', reps: '1000', weight: '1000' })).toBeNull();
    expect(errorsOf({ sets: '1', reps: '1', weight: '0' })).toBeNull();
  });

  it('rejects negative and huge weights', () => {
    expect(errorsOf({ weight: '-1' })?.weight).toBeDefined();
    expect(errorsOf({ weight: '5000' })?.weight).toBeDefined();
  });

  it('rejects impossible or malformed dates', () => {
    expect(errorsOf({ date: '2026-02-30' })?.date).toBeDefined();
    expect(errorsOf({ date: '' })?.date).toBeDefined();
    expect(errorsOf({ date: '17/11/2026' })?.date).toBeDefined();
  });

  it('reports every bad field at once', () => {
    const errors = errorsOf({ exerciseName: '', sets: '0', reps: 'x', weight: '-1', date: 'nope' });
    expect(Object.keys(errors ?? {}).sort()).toEqual([
      'date',
      'exerciseName',
      'reps',
      'sets',
      'weight',
    ]);
  });
});
