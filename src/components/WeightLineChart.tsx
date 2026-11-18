import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { describeWeightTrend, layoutLineChart, type WeightPoint } from '@/lib/chart';
import { radius, spacing, typography, useTheme } from '@/theme';

// Coordinates from the design source (326 x 150 viewBox).
const VIEW_W = 326;
const VIEW_H = 150;
const BOX = { left: 36, right: 296, top: 32, bottom: 104 };
const GRID_X1 = 30;
const GRID_X2 = 322;
const X_LABEL_Y = 132;

interface WeightLineChartProps {
  name: string;
  series: readonly WeightPoint[];
}

/** Weight over time: accent line, hollow points, latest point filled in ink. */
export function WeightLineChart({ name, series }: WeightLineChartProps) {
  const { colors } = useTheme();
  const layout = layoutLineChart(series, BOX);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.rowTitle, { color: colors.ink }]}>
          Weight over time
        </Text>
        <Text style={[typography.caption, { color: colors.inkMuted }]}>kg</Text>
      </View>

      {layout === null ? (
        <Text style={[typography.body, styles.empty, { color: colors.inkMuted }]}>
          Log this exercise with a weight to see how it changes over time.
        </Text>
      ) : (
        <Svg
          width="100%"
          height={VIEW_H}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          accessible
          accessibilityRole="image"
          accessibilityLabel={describeWeightTrend(name, series)}
        >
          <G stroke={colors.hairline} strokeWidth={1}>
            {layout.ticks.map((tick) => (
              <Line key={tick.value} x1={GRID_X1} y1={tick.y} x2={GRID_X2} y2={tick.y} />
            ))}
          </G>
          {layout.ticks.map((tick) => (
            <SvgText
              key={`t${tick.value}`}
              x={0}
              y={tick.y + 4}
              fontSize={11}
              fill={colors.inkMuted}
            >
              {tick.label}
            </SvgText>
          ))}
          {layout.xLabels.map((label) => (
            <SvgText
              key={`x${label.x}`}
              x={label.x}
              y={X_LABEL_Y}
              fontSize={11}
              textAnchor="middle"
              fill={colors.inkMuted}
            >
              {label.label}
            </SvgText>
          ))}
          <Polyline
            points={layout.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {layout.points.map((p, i) => {
            const latest = i === layout.points.length - 1;
            return (
              <Circle
                key={`${p.date}`}
                cx={p.x}
                cy={p.y}
                r={latest ? 5 : 4}
                fill={latest ? colors.ink : colors.surface}
                stroke={latest ? colors.ink : colors.accent}
                strokeWidth={2}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.hero,
    paddingTop: 18,
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  empty: { fontWeight: '400', paddingHorizontal: spacing.xs, paddingBottom: spacing.sm },
});
