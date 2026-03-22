import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { MainTabParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, space, typography, shadowCard, shadowSoft } from "../theme";
import { StatHero, BarSeries } from "../components/charts";

type Q = {
  id: number;
  completed: boolean;
  template: { title: string; description: string; xp_reward: number };
};

type SleepRow = { date: string; hours_slept: string | number };
type WaterRow = { date: string; glasses: number };
type StressRow = { created_at: string; level: number };

type P = BottomTabScreenProps<MainTabParamList, "Home">;

const shortcuts: { t: string; tab: keyof MainTabParamList; screen: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { t: "Schedule", tab: "Plan", screen: "Schedule", icon: "calendar-outline" },
  { t: "Mood", tab: "Health", screen: "Mood", icon: "heart-outline" },
  { t: "Coach", tab: "Coach", screen: "Insights", icon: "sparkles-outline" },
  { t: "Chat", tab: "Coach", screen: "Chat", icon: "chatbubble-ellipses-outline" },
  { t: "Logs", tab: "Health", screen: "Wellness", icon: "water-outline" },
  { t: "Food", tab: "Plan", screen: "Meals", icon: "restaurant-outline" },
  { t: "Focus", tab: "More", screen: "Focus", icon: "headset-outline" },
  { t: "Settings", tab: "More", screen: "Settings", icon: "settings-outline" },
];

export default function HomeScreen({ navigation }: P) {
  const { api, profile, refreshProfile } = useAuth();
  const [quests, setQuests] = useState<Q[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sleepChart, setSleepChart] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [waterChart, setWaterChart] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [stressChart, setStressChart] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [sleepHero, setSleepHero] = useState("—");
  const [waterHero, setWaterHero] = useState("—");
  const [stressHero, setStressHero] = useState("—");

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get<Q[]>("quests/today/"),
      api.get<SleepRow[]>("sleep-entries/"),
      api.get<WaterRow[]>("water-entries/"),
      api.get<StressRow[]>("stress-entries/"),
    ]);
    if (results[0].status === "fulfilled") setQuests(results[0].value.data);
    const sleepData = results[1].status === "fulfilled" ? results[1].value.data : [];
    const waterData = results[2].status === "fulfilled" ? results[2].value.data : [];
    const stressData = results[3].status === "fulfilled" ? results[3].value.data : [];

    const sl = sleepData.slice(0, 7).reverse();
    setSleepChart({
      labels: sl.map((r) => (r.date.length >= 10 ? r.date.slice(5, 10) : r.date)),
      values: sl.map((r) => Number(r.hours_slept)),
    });
    setSleepHero(sl.length ? `${Number(sl[sl.length - 1].hours_slept)} h` : "—");

    const wa = waterData.slice(0, 7).reverse();
    setWaterChart({
      labels: wa.map((r) => (r.date.length >= 10 ? r.date.slice(5, 10) : r.date)),
      values: wa.map((r) => r.glasses),
    });
    setWaterHero(wa.length ? `${wa[wa.length - 1].glasses}` : "—");

    const st = stressData.slice(0, 7).reverse();
    setStressChart({
      labels: st.map((r) => (r.created_at.length >= 16 ? r.created_at.slice(5, 10) : "·")),
      values: st.map((r) => r.level),
    });
    setStressHero(st.length ? `${st[st.length - 1].level}/5` : "—");

    await refreshProfile();
  }, [api, refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const doneQuests = quests.filter((q) => q.completed).length;

  const goShortcut = (tab: keyof MainTabParamList, screen?: string) => {
    if (screen) (navigation as { navigate: (a: string, b?: { screen: string }) => void }).navigate(tab, { screen });
    else navigation.navigate(tab);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, shadowCard]}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.name}>{profile?.username || "student"}</Text>
        <View style={styles.xpRow}>
          <View style={styles.xpPill}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpVal}>{profile?.total_xp ?? 0}</Text>
          </View>
          <Text style={styles.xpHint}>Pull to refresh · tabs below for every area</Text>
        </View>
      </View>

      <Text style={styles.section}>Your numbers</Text>
      <View style={styles.kpiRow}>
        <StatHero label="Sleep" value={sleepHero} hint="last logged" accent={colors.primary} />
        <View style={styles.kpiGap} />
        <StatHero label="Water" value={waterHero} hint="glasses (day)" accent="#0284c7" />
      </View>
      <View style={styles.kpiRow}>
        <StatHero label="Stress" value={stressHero} hint="latest 1–5" accent="#d97706" />
        <View style={styles.kpiGap} />
        <StatHero
          label="Quests"
          value={quests.length ? `${doneQuests}/${quests.length}` : "—"}
          hint="done today"
          accent={colors.success}
        />
      </View>

      <BarSeries
        title="Sleep (last up to 7 logs)"
        labels={sleepChart.labels}
        values={sleepChart.values}
        max={12}
        unit="h"
        barColor={colors.primary}
        emptyHint="Log sleep under Body — Wellness"
      />
      <BarSeries
        title="Water (last up to 7 days)"
        labels={waterChart.labels}
        values={waterChart.values}
        max={12}
        unit=""
        barColor="#0284c7"
        emptyHint="Log water under Body — Wellness"
      />
      <BarSeries
        title="Stress (last up to 7 checks)"
        labels={stressChart.labels}
        values={stressChart.values}
        max={5}
        unit=""
        barColor="#d97706"
        emptyHint="Log stress under Body — Wellness tab"
      />

      <Text style={styles.section}>Shortcuts</Text>
      <View style={styles.shortGrid}>
        {shortcuts.map((x) => (
          <Pressable
            key={x.t}
            style={({ pressed }) => [styles.shortChip, shadowSoft, pressed && { opacity: 0.9 }]}
            onPress={() => goShortcut(x.tab, x.screen)}
          >
            <Ionicons name={x.icon} size={20} color={colors.primary} />
            <Text style={styles.shortChipT}>{x.t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Today&apos;s quests</Text>
      {quests.map((q) => (
        <View key={q.id} style={[styles.questCard, shadowSoft]}>
          <View style={styles.questTop}>
            <Text style={styles.questTitle}>{q.template.title}</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeT}>+{q.template.xp_reward}</Text>
            </View>
          </View>
          <Text style={styles.questDesc}>{q.template.description}</Text>
          {!q.completed ? (
            <Pressable
              style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.9 }]}
              onPress={async () => {
                await api.post(`quests/${q.id}/complete/`, {});
                await load();
              }}
            >
              <Text style={styles.completeBtnT}>Mark complete</Text>
            </Pressable>
          ) : (
            <View style={styles.doneRow}>
              <Text style={styles.doneT}>Done</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.lg, paddingBottom: 40 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.lg,
  },
  greeting: { ...typography.caption, textTransform: "uppercase", letterSpacing: 1 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: 4 },
  xpRow: { flexDirection: "row", alignItems: "center", marginTop: space.lg },
  xpPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: space.md,
  },
  xpLabel: { fontSize: 12, fontWeight: "700", color: colors.primaryPressed, marginRight: 6 },
  xpVal: { fontSize: 18, fontWeight: "800", color: colors.primaryPressed },
  xpHint: { flex: 1, ...typography.caption },
  section: { ...typography.h2, marginTop: space.lg, marginBottom: space.sm },
  kpiRow: { flexDirection: "row", marginBottom: space.md },
  kpiGap: { width: space.md },
  shortGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -space.xs },
  shortChip: {
    width: "23%",
    minWidth: 76,
    flexGrow: 1,
    margin: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  shortChipT: { fontSize: 11, fontWeight: "700", color: colors.text, marginTop: 6, textAlign: "center" },
  questCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  questTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text, paddingRight: space.sm },
  xpBadge: { backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  xpBadgeT: { fontSize: 13, fontWeight: "800", color: "#c2410c" },
  questDesc: { ...typography.body, marginTop: space.sm },
  completeBtn: {
    marginTop: space.md,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  completeBtnT: { color: "#fff", fontWeight: "700", fontSize: 14 },
  doneRow: { marginTop: space.md },
  doneT: { color: colors.success, fontWeight: "800", fontSize: 14 },
});
