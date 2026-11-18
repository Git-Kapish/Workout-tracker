import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { tabBarBottomOffset } from '@/hooks/useTabBarClearance';
import { haptics } from '@/platform/haptics';
import { highlightPosition, nearestTab, type TabBox } from '@/lib/tabScrub';
import { floatingBar, radius, size, spacing, typography, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

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

interface ItemBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A floating liquid-glass capsule over the content (the router lays the bar out as an
 * absolutely positioned overlay, so screens run underneath it and pad their lists with
 * useTabBarClearance). The centre "+" is not a tab: it opens the log modal.
 *
 * Like the iOS tab bar, a finger can slide along it: the highlight follows the finger and the
 * tab under it opens on release. The highlight is one view that springs between items.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const focusedName = state.routes[state.index]?.name ?? '';
  const selectedName = activeTabName(focusedName);

  const boxes = useRef<Record<string, ItemBox>>({});
  // Every item is the same size, so the first item's box sizes the highlight.
  const [first, setFirst] = useState<ItemBox | null>(null);
  const measured = first !== null;
  const [scrubbing, setScrubbing] = useState<string | null>(null);
  const [highlightX] = useState(() => new Animated.Value(0));
  const dragging = useRef(false);
  const lastScrub = useRef<string | null>(null);

  const tabRoutes = state.routes.filter((route) => route.name in TAB_ICONS);

  const open = (routeName: string) => {
    const route = tabRoutes.find((r) => r.name === routeName);
    if (!route) return;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    // Compare with the real focused route: on a detail screen the highlighted item must
    // still navigate back to its list.
    if (focusedName !== route.name && !event.defaultPrevented) {
      haptics.selection();
      navigateToTab(route.key);
    }
  };

  // Gesture callbacks outlive renders, so they read the latest values through a ref.
  const latest = useRef({ open, tabRoutes, selectedName });
  useEffect(() => {
    latest.current = { open, tabRoutes, selectedName };
  });

  const tabBoxes = (): TabBox[] =>
    latest.current.tabRoutes.flatMap((route) => {
      const box = boxes.current[route.name];
      return box ? [{ name: route.name, x: box.x, width: box.width }] : [];
    });
  const nearest = (xInCapsule: number) => nearestTab(tabBoxes(), xInCapsule);

  const moveHighlight = (name: string, animated: boolean) => {
    const box = boxes.current[name];
    if (!box) return;
    if (!animated || reduceMotion) {
      highlightX.setValue(box.x);
      return;
    }
    Animated.spring(highlightX, {
      toValue: box.x,
      speed: 20,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  // Follows the selected tab however it changed (tap, scrub, or navigation from elsewhere).
  useEffect(() => {
    if (measured && !dragging.current) moveHighlight(selectedName, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- moveHighlight only reads refs
  }, [selectedName, measured]);

  // The refs below are only read inside gesture callbacks, which run after render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      // Only claim a mostly-horizontal drag, so plain taps still reach the buttons.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        dragging.current = true;
        lastScrub.current = latest.current.selectedName;
      },
      onPanResponderMove: (_, g) => {
        const x = g.moveX - floatingBar.sideMargin;
        const position = highlightPosition(tabBoxes(), x);
        const target = nearest(x);
        if (position === null || !target) return;
        highlightX.setValue(position);
        if (lastScrub.current !== target) {
          lastScrub.current = target;
          haptics.selection(); // a tick each time the finger crosses onto a new tab
        }
        setScrubbing((current) => (current === target ? current : target));
      },
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        const target = nearest(g.moveX - floatingBar.sideMargin);
        setScrubbing(null);
        if (target) {
          moveHighlight(target, true);
          latest.current.open(target);
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        setScrubbing(null);
        moveHighlight(latest.current.selectedName, true);
      },
    }),
  );

  const items = tabRoutes.map((route) => {
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const selected = selectedName === route.name;
    // While sliding a finger across, the tint follows it before the tab has opened.
    const lit = (scrubbing ?? selectedName) === route.name;
    const tint = lit ? colors.ink : colors.inkMuted;

    return (
      <PressableScale
        key={route.key}
        scaleTo={0.92}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={() => open(route.name)}
        onLayout={(event) => {
          boxes.current[route.name] = event.nativeEvent.layout;
          if (route.name === selectedName && !measured) {
            highlightX.setValue(event.nativeEvent.layout.x);
          }
          if (!measured || route.name === tabRoutes[0]?.name) setFirst(event.nativeEvent.layout);
        }}
        style={styles.item}
      >
        <Icon name={TAB_ICONS[route.name] ?? 'home'} color={tint} />
        <Text
          maxFontSizeMultiplier={1.2}
          style={[typography.tabLabel, { color: tint, fontWeight: lit ? '600' : '500' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </PressableScale>
    );
  });

  const plus = (
    <PressableScale
      key="plus"
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel="Log exercise"
      onPress={() => router.push('/log')}
      style={[styles.plus, { backgroundColor: colors.ink }]}
    >
      <Icon name="plus" color={colors.surface} />
    </PressableScale>
  );

  return (
    <View
      testID="tab-bar"
      style={[
        styles.wrap,
        {
          bottom: tabBarBottomOffset(insets.bottom),
          left: floatingBar.sideMargin,
          right: floatingBar.sideMargin,
        },
      ]}
      {...pan.panHandlers}
    >
      <GlassSurface style={styles.capsule}>
        {measured && first ? (
          <Animated.View
            testID="tab-highlight"
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                top: first.y,
                width: first.width,
                height: first.height,
                backgroundColor: colors.fieldBg,
                transform: [{ translateX: highlightX }],
              },
            ]}
          />
        ) : null}
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
  highlight: { position: 'absolute', left: 0, borderRadius: radius.full },
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
});
