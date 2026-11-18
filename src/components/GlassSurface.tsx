import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useReduceTransparency } from '@/hooks/useReduceTransparency';
import { useTheme } from '@/theme';

let supported: boolean | undefined;

/** Real liquid glass needs iOS 26+ and its runtime API; anything else gets the fallback. */
function supportsLiquidGlass(): boolean {
  if (supported === undefined) {
    try {
      supported = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
    } catch {
      supported = false; // no native module (tests, older runtimes)
    }
  }
  return supported;
}

/** Forgets the cached support check. Only tests need this (the answer never changes at runtime). */
export function resetLiquidGlassDetection(): void {
  supported = undefined;
}

interface GlassSurfaceProps extends ViewProps {
  /** Reacts to touch (iOS 26). Use on controls, not on containers. */
  interactive?: boolean;
  /** Tints the glass; the fallback becomes this solid colour. */
  tint?: string;
  effect?: 'regular' | 'clear';
}

/**
 * Liquid glass for floating chrome (tab bar, header buttons, toggles). It degrades to a frosted
 * solid surface before iOS 26 and when Reduce Transparency is on, so text and icons on it stay
 * legible in every case. Do not stack glass on glass, and keep content cards solid.
 */
export function GlassSurface({
  interactive = false,
  tint,
  effect = 'regular',
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();
  const reduceTransparency = useReduceTransparency();

  if (supportsLiquidGlass() && !reduceTransparency) {
    return (
      <GlassView
        glassEffectStyle={effect}
        isInteractive={interactive}
        tintColor={tint}
        colorScheme={isDark ? 'dark' : 'light'}
        style={style}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        style,
        styles.fallback,
        {
          backgroundColor: tint ?? colors.glassFallback,
          borderColor: colors.glassBorder,
          boxShadow: `0 4px 16px ${colors.shadow}`,
        },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/**
 * Wraps neighbouring glass controls so they blend into one shape when close together (iOS 26).
 * Elsewhere it is just a row.
 */
export function GlassGroup({
  spacing = 8,
  style,
  children,
  ...rest
}: ViewProps & { spacing?: number }) {
  const reduceTransparency = useReduceTransparency();
  const merge = supportsLiquidGlass() && !reduceTransparency;
  if (merge) {
    return (
      <GlassContainer spacing={spacing} style={[styles.group, style]} {...rest}>
        {children}
      </GlassContainer>
    );
  }
  return (
    <View style={[styles.group, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fallback: { borderWidth: StyleSheet.hairlineWidth },
});
