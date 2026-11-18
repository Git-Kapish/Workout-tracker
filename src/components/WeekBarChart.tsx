import { StyleSheet, Text, View } from 'react-native';

import { GrowBar } from './GrowBar';

import { formatNumber } from '@/lib/format';
import type { ChartBar, ChartMetric } from '@/lib/progress';
import { radius, spacing, typography, useTheme } from '@/theme';

// Bar geometry from the design source: 134pt tall area, bars up to 90pt, 22pt wide.
const CHART_HEIGHT = 134;
const MAX_BAR = 90;
const MIN_BAR = 6;
const STUB_BAR = 3; // an empty week is a small stub with a "0", never a missing bar
const BAR_WIDTH = 22;

interface WeekBarChartProps {
  bars: readonly ChartBar[];
  metric: ChartMetric;
}

/**
 * Hand-drawn with plain Views (DESIGN.md allows this instead of a chart library): no extra
 * dependency, nothing that can break in Expo Go, and every bar is individually accessible.
 */
export function WeekBarChart({ bars, metric }: WeekBarChartProps) {
  const { colors } = useTheme();
  const unit = metric === 'reps' ? 'reps' : 'kg volume';

  return (
    <View
      style={styles.chart}
      accessibilityLabel={`Bar chart of ${unit} for the last ${bars.length} weeks`}
    >
      {bars.map((bar, index) => {
        const height =
          bar.value === 0 ? STUB_BAR : Math.max(MIN_BAR, Math.round(bar.ratio * MAX_BAR));
        return (
          <View
            key={bar.weekStart}
            accessible
            accessibilityLabel={`Week of ${bar.xLabel}: ${formatNumber(bar.value)} ${unit}${bar.isSelected ? ', selected week' : ''}`}
            style={styles.column}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={[
                typography.tabLabel,
                {
                  color: bar.isSelected ? colors.ink : colors.inkMuted,
                  fontWeight: bar.isSelected ? '700' : '500',
                },
              ]}
            >
              {bar.valueLabel}
            </Text>
            {/* Keyed by metric so switching Reps/Volume grows the bars in again. */}
            <GrowBar
              key={metric}
              index={index}
              style={[
                styles.bar,
                { height, backgroundColor: bar.isSelected ? colors.ink : colors.barPast },
              ]}
            />
            <Text
              maxFontSizeMultiplier={1.2}
              style={[typography.tabLabel, { color: colors.inkMuted }]}
            >
              {bar.xLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: CHART_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  column: {
    flex: 1,
    minWidth: 0,
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: radius.barTop,
    borderTopRightRadius: radius.barTop,
    borderBottomLeftRadius: radius.barBottom,
    borderBottomRightRadius: radius.barBottom,
  },
});
