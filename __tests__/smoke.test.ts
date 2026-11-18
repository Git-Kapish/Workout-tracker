import { lightPalette } from '../src/theme/colors';

describe('theme tokens', () => {
  it('uses the DESIGN.md ink colour', () => {
    expect(lightPalette.ink).toBe('#141414');
  });
});
