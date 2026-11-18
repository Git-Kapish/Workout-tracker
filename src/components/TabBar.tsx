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

// The centre "+" is not a tab: it opens the log modal (DESIGN.md §3.1).
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const focused = state.index === index;
    const tint = focused ? colors.ink : colors.inkMuted;

    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.item}
      >
        <Icon name={TAB_ICONS[route.name] ?? 'home'} color={tint} />
        <Text
          style={[typography.tabLabel, { color: tint, fontWeight: focused ? '600' : '500' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
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
      <View style={styles.row}>{[items[0], items[1], plus, items[2], items[3]]}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: size.tabBar,
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
    height: size.tabItemH,
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
