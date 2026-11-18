import { personalBests } from '@/lib/metrics';

const e = (sets: number, reps: number, weightKg: number | null) => ({ sets, reps, weightKg });

describe('personalBests', () => {
  it('has no records for an empty history', () => {
    expect(personalBests([])).toEqual({
      maxWeightKg: null,
      bestVolumeKg: null,
      maxRepsPerSet: null,
    });
  });

  it('reports a single entry as all three records', () => {
    expect(personalBests([e(3, 10, 42.5)])).toEqual({
      maxWeightKg: 42.5,
      bestVolumeKg: 1275,
      maxRepsPerSet: 10,
    });
  });

  it("matches the design's Bench Press history (max 42.5 kg, best volume 1,275 kg, 10 reps)", () => {
    expect(personalBests([e(3, 10, 42.5), e(3, 10, 40), e(3, 10, 40), e(3, 8, 40)])).toEqual({
      maxWeightKg: 42.5,
      bestVolumeKg: 1275,
      maxRepsPerSet: 10,
    });
  });

  it('keeps the three records independent (heaviest, biggest volume and most reps can be different entries)', () => {
    const b = personalBests([e(1, 3, 100), e(5, 10, 60), e(2, 20, 20)]);
    expect(b.maxWeightKg).toBe(100); // the heavy single
    expect(b.bestVolumeKg).toBe(3000); // 5 x 10 x 60
    expect(b.maxRepsPerSet).toBe(20); // the light high-rep set
  });

  it('handles ties without changing the value', () => {
    expect(personalBests([e(3, 10, 40), e(3, 10, 40)])).toEqual({
      maxWeightKg: 40,
      bestVolumeKg: 1200,
      maxRepsPerSet: 10,
    });
  });

  it('gives a bodyweight exercise reps but no weight or volume record', () => {
    expect(personalBests([e(3, 6, null), e(3, 8, null)])).toEqual({
      maxWeightKg: null,
      bestVolumeKg: null,
      maxRepsPerSet: 8,
    });
  });

  it('ignores blank and 0 kg weights for weight records, while their reps still count', () => {
    const b = personalBests([e(3, 15, null), e(3, 12, 0), e(3, 8, 20)]);
    expect(b.maxWeightKg).toBe(20);
    expect(b.bestVolumeKg).toBe(480);
    expect(b.maxRepsPerSet).toBe(15);
    expect(personalBests([e(3, 12, 0)]).maxWeightKg).toBeNull();
  });

  it('has no floating-point noise in volume', () => {
    expect(personalBests([e(1, 1, 0.1), e(3, 1, 0.1)]).bestVolumeKg).toBe(0.3);
    expect(personalBests([e(3, 3, 22.55)]).bestVolumeKg).toBe(202.95);
  });
});
