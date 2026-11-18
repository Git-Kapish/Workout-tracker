import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tabBarBottomOffset } from '@/hooks/useTabBarClearance';
import { floatingBar, radius, size, spacing, typography, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon, type IconName } from './Icon';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  week: 'calendar',
  progress: 'chart',
  exercises: 'dumbbell',
};

// Hidden routes that live inside the tabs: they get no bar item and keep their parent's item
// highlighted (the design shows the bar with "Exercises" active on the exercise detail).
const PARENT_TAB: Record<string, string> = { 'exercise/[name]': 'exercises' };

/** Which bar item is highlighted while the route named `routeName` is showing. */
export function activeTabName(routeName: string): string {
  return PARENT_TAB[routeName] ?? routeName;
}

/**
 * A floating liquid-glass capsule over the content (the router lays the bar out as an
 * absolutely positioned overlay, so screens run underneath it and pad their lists with
 * useTabBarClearance). The centre "+" is not a tab: it opens the log modal.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const focusedName = state.routes[state.index]?.name ?? '';

  const items = state.routes.flatMap((route) => {
    if (!(route.name in TAB_ICONS)) return []; // hidden route: no bar item
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const selected = activeTabName(focusedName) === route.name;
    const tint = selected ? colors.ink : colors.inkMuted;

    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      // Compare with the real focused route: on a detail screen the highlighted item must
      // still navigate back to its list.
      if (focusedName !== route.name && !event.defaultPrevented) navigateToTab(route.key);
    };

    return [
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        // Feedback on press-in, no transition: instant and never in the way of a tap.
        style={({ pressed }) => [
          styles.item,
          selected && { backgroundColor: colors.fieldBg },
          pressed && styles.pressed,
        ]}
      >
        <Icon name={TAB_ICONS[route.name] ?? 'home'} color={tint} />
        <Text
          maxFontSizeMultiplier={1.2}
          style={[typography.tabLabel, { color: tint, fontWeight: selected ? '600' : '500' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>,
    ];
  });

  const plus = (
    <Pressable
      key="plus"
      accessibilityRole="button"
      accessibilityLabel="Log exercise"
      onPress={() => router.push('/log')}
      style={({ pressed }) => [
        styles.plus,
        { backgroundColor: colors.ink },
        pressed && styles.pressed,
      ]}
    >
      <Icon name="plus" color={colors.surface} />
    </Pressable>
  );

  return (
    <View
      testID="tab-bar"
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: tabBarBottomOffset(insets.bottom),
          left: floatingBar.sideMargin,
          right: floatingBar.sideMargin,
        },
      ]}
    >
      <GlassSurface style={styles.capsule}>
        {[...items.slice(0, 2), plus, ...items.slice(2)]}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  capsule: {
    minHeight: floatingBar.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  item: {
    flex: 1,
    minHeight: size.tabItemH - 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.full,
  },
  plus: {
    width: size.plusButton,
    height: size.plusButton,
    marginHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.96 }] },
});
