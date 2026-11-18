import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { GlassGroup, GlassSurface, resetLiquidGlassDetection } from '@/components/GlassSurface';
import { darkPalette, lightPalette } from '@/theme/colors';

// A controllable stand-in for the native liquid glass module. The component caches whether
// glass is supported, so every test loads a fresh copy of it.
const glass = { liquid: false, api: true, throws: false };

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  return {
    isLiquidGlassAvailable: () => {
      if (glass.throws) throw new Error('no native module');
      return glass.liquid;
    },
    isGlassEffectAPIAvailable: () => glass.api,
    GlassView: (props: Record<string, unknown>) => React.createElement('GlassViewMock', props),
    GlassContainer: (props: Record<string, unknown>) =>
      React.createElement('GlassContainerMock', props),
  };
});

beforeEach(() => {
  Object.assign(glass, { liquid: false, api: true, throws: false });
  resetLiquidGlassDetection();
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
});
afterEach(() => jest.restoreAllMocks());

describe('GlassSurface', () => {
  it('uses real liquid glass on iOS 26 with the right options', async () => {
    Object.assign(glass, { liquid: true });
    await render(<GlassSurface testID="g" interactive tint="#123456" effect="clear" />);
    const view = screen.getByTestId('g');
    expect(view.type).toBe('GlassViewMock');
    expect(view.props).toMatchObject({
      glassEffectStyle: 'clear',
      isInteractive: true,
      tintColor: '#123456',
      colorScheme: 'light',
    });
  });

  it('falls back to a frosted solid surface before iOS 26', async () => {
    await render(<GlassSurface testID="g" style={{ width: 44 }} />);
    const view = screen.getByTestId('g');
    expect(view.type).not.toBe('GlassViewMock');
    const style = StyleSheet.flatten(view.props.style);
    expect(style.backgroundColor).toBe(lightPalette.glassFallback);
    expect(style.borderColor).toBe(lightPalette.glassBorder);
    expect(style.width).toBe(44); // the caller's layout is kept
  });

  it('uses the tint as the solid colour in the fallback', async () => {
    await render(<GlassSurface testID="g" tint="#abcdef" />);
    expect(StyleSheet.flatten(screen.getByTestId('g').props.style).backgroundColor).toBe('#abcdef');
  });

  it('falls back when the glass API is missing (some iOS 26 betas)', async () => {
    Object.assign(glass, { liquid: true, api: false });
    await render(<GlassSurface testID="g" />);
    expect(screen.getByTestId('g').type).not.toBe('GlassViewMock');
  });

  it('falls back instead of crashing when the native module is missing', async () => {
    Object.assign(glass, { throws: true });
    await render(<GlassSurface testID="g" />);
    expect(screen.getByTestId('g').type).not.toBe('GlassViewMock');
  });

  it('falls back when the user turned on Reduce Transparency, even on iOS 26', async () => {
    Object.assign(glass, { liquid: true });
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    await render(<GlassSurface testID="g" />);
    expect(await screen.findByTestId('g')).toBeOnTheScreen();
    await screen.findByTestId('g');
    await new Promise((resolve) => setTimeout(resolve, 20)); // let the setting arrive
    expect(screen.getByTestId('g').type).not.toBe('GlassViewMock');
  });

  it('renders its children in both modes', async () => {
    await render(
      <GlassSurface testID="fallback">
        <GlassGroup testID="inner" />
      </GlassSurface>,
    );
    expect(screen.getByTestId('inner')).toBeOnTheScreen();
    Object.assign(glass, { liquid: true });
    resetLiquidGlassDetection();
    await render(
      <GlassSurface testID="real">
        <GlassGroup testID="inner2" />
      </GlassSurface>,
    );
    expect(screen.getByTestId('inner2')).toBeOnTheScreen();
  });

  it('shows dark-mode colours in the fallback (palette sanity)', () => {
    expect(darkPalette.glassFallback).not.toBe(lightPalette.glassFallback);
  });
});

describe('GlassGroup', () => {
  it('merges neighbouring glass controls with a GlassContainer on iOS 26', async () => {
    Object.assign(glass, { liquid: true });
    await render(<GlassGroup testID="group" spacing={12} />);
    const view = screen.getByTestId('group');
    expect(view.type).toBe('GlassContainerMock');
    expect(view.props.spacing).toBe(12);
  });

  it('is a plain row elsewhere', async () => {
    await render(<GlassGroup testID="group" />);
    expect(screen.getByTestId('group').type).not.toBe('GlassContainerMock');
  });
});
