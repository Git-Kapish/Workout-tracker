import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, size, spacing, tabBarShadow, typography, useTheme } from '@/theme';

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

// The centre "+" is not a tab: it opens the log modal (DESIGN.md §3.1).
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
        style={styles.item}
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
      style={[styles.plus, { backgroundColor: colors.ink }]}
    >
      <Icon name="plus" color={colors.surface} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.bar,
        tabBarShadow,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.row}>{[...items.slice(0, 2), plus, ...items.slice(2)]}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: size.tabBar,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  item: {
    width: size.tabItemW + spacing.sm,
    minHeight: size.tabItemH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  plus: {
    width: size.plusButton,
    height: size.plusButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
