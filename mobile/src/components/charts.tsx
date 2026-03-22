import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { colors, radius, space, typography, shadowSoft } from "../theme";

type StatHeroProps = { label: string; value: string; hint?: string; accent?: string };

export function StatHero({ label, value, hint, accent }: StatHeroProps) {
  return (
    <View style={[styles.heroTile, shadowSoft, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null]}>
      <Text style={styles.heroLabel}>{label}</Text>
      <Text style={styles.heroValue}>{value}</Text>
      {hint ? <Text style={styles.heroHint}>{hint}</Text> : null}
    </View>
  );
}

type BarSeriesProps = {
  title: string;
  labels: string[];
  values: number[];
  max?: number;
  unit?: string;
  barColor?: string;
  emptyHint?: string;
};

export function BarSeries({
  title,
  labels,
  values,
  max: maxIn,
  unit = "",
  barColor = colors.primary,
  emptyHint = "No data yet",
}: BarSeriesProps) {
  const [innerW, setInnerW] = useState(280);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - space.lg * 2;
    if (w > 40) setInnerW(w);
  };
  const n = values.length;
  const max = maxIn ?? (n ? Math.max(...values, 0.01) : 1);
  const gap = 6;
  const colW = n > 0 ? Math.max(24, (innerW - gap * (n - 1)) / n) : 24;
  const chartH = 128;

  return (
    <View style={[styles.chartCard, shadowSoft]} onLayout={onLayout}>
      <Text style={styles.chartTitle}>{title}</Text>
      {n === 0 ? (
        <Text style={styles.empty}>{emptyHint}</Text>
      ) : (
        <View style={styles.barRow}>
          {values.map((v, i) => {
            const h = max > 0 ? Math.max(10, (v / max) * chartH) : 10;
            return (
              <View key={`${labels[i]}-${i}`} style={[styles.barCol, { width: colW, marginRight: i < n - 1 ? gap : 0 }]}>
                <Text style={styles.barVal} numberOfLines={1}>
                  {Number.isInteger(v) ? v : v.toFixed(1)}
                  {unit}
                </Text>
                <View style={[styles.barTrack, { height: chartH }]}>
                  <View style={[styles.barFill, { height: h, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.barLab} numberOfLines={1}>
                  {labels[i]}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroTile: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: { ...typography.caption, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  heroValue: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 4 },
  heroHint: { ...typography.caption, marginTop: 4 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: { ...typography.h2, marginBottom: space.sm },
  empty: { ...typography.caption, paddingVertical: space.lg },
  barRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-start" },
  barCol: { alignItems: "center" },
  barVal: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: 6 },
  barTrack: { width: "100%", justifyContent: "flex-end", borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  barFill: { width: "100%", borderRadius: radius.sm, minHeight: 4 },
  barLab: { fontSize: 10, color: colors.textMuted, marginTop: 6, textAlign: "center", width: "100%" },
});
