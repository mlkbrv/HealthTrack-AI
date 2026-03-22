import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, TextInput } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

type R = { id: number; title: string; prep_minutes: number };

function mondayISO(d = new Date()) {
  const x = new Date(d.getTime());
  const py = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - py);
  return x.toISOString().slice(0, 10);
}

const slots: { wd: number; slot: "breakfast" | "lunch" | "dinner"; label: string }[] = [];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
for (let wd = 0; wd < 7; wd += 1) {
  slots.push({ wd, slot: "breakfast", label: `${days[wd]} breakfast` });
  slots.push({ wd, slot: "lunch", label: `${days[wd]} lunch` });
  slots.push({ wd, slot: "dinner", label: `${days[wd]} dinner` });
}

export default function MealsScreen() {
  const { api } = useAuth();
  const [recipes, setRecipes] = useState<R[]>([]);
  const [weekStart, setWeekStart] = useState(mondayISO());
  const [pick, setPick] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<number | null>(null);
  const inp = inputStyle();

  const load = useCallback(async () => {
    const { data } = await api.get<R[]>("recipes/");
    setRecipes(data);
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  const key = (wd: number, slot: string) => `${wd}-${slot}`;

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionLabel style={{ marginTop: 0 }}>Week plan</SectionLabel>
      <Card>
        <Text style={typography.label}>Week start (Monday, YYYY-MM-DD)</Text>
        <TextInput style={[inp, s.field]} value={weekStart} onChangeText={setWeekStart} autoCapitalize="none" />
        <Text style={s.hint}>Select a recipe chip, then tap a slot to assign.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {recipes.map((r) => (
            <Pressable key={r.id} style={[s.chip, sel === r.id && s.chipOn]} onPress={() => setSel(r.id)}>
              <Text style={[s.chipT, sel === r.id && s.chipTon]} numberOfLines={1}>
                {r.title.slice(0, 18)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={s.quick}
          onPress={() => {
            if (!recipes.length) return;
            const n: Record<string, number> = {};
            for (let wd = 0; wd < 7; wd += 1) {
              n[key(wd, "lunch")] = recipes[0].id;
            }
            setPick(n);
            Alert.alert("Filled", "All lunches set to first recipe.");
          }}
        >
          <Text style={s.quickT}>Quick fill: all lunches → first recipe</Text>
        </Pressable>
      </Card>
      <SectionLabel>Slots</SectionLabel>
      {slots.map((sl) => (
        <Pressable
          key={sl.label}
          style={[s.slot, shadowSoft, pick[key(sl.wd, sl.slot)] != null ? s.slotFilled : null]}
          onPress={() => {
            if (sel == null) {
              Alert.alert("Select a recipe chip first.");
              return;
            }
            setPick((p) => ({ ...p, [key(sl.wd, sl.slot)]: sel }));
          }}
        >
          <Text style={s.slotT}>{sl.label}</Text>
          <Text style={s.slotV} numberOfLines={2}>
            {pick[key(sl.wd, sl.slot)]
              ? recipes.find((x) => x.id === pick[key(sl.wd, sl.slot)])?.title || ""
              : "—"}
          </Text>
        </Pressable>
      ))}
      <Button
        title="Save week plan"
        onPress={async () => {
          const entries = Object.entries(pick).map(([k, recipe_id]) => {
            const [wd, slot] = k.split("-");
            return {
              weekday: parseInt(wd, 10),
              slot,
              recipe_id,
            };
          });
          if (!entries.length) {
            Alert.alert("Assign at least one slot.");
            return;
          }
          try {
            await api.post("meal-plan/week/", { week_start: weekStart, entries });
            Alert.alert("Saved", "Meal plan updated.");
          } catch {
            Alert.alert("Error", "Could not save meal plan.");
          }
        }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  field: { marginBottom: space.md },
  hint: { ...typography.caption, marginBottom: space.md },
  chipRow: { flexDirection: "row", flexWrap: "nowrap", paddingVertical: space.xs },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    marginRight: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipT: { color: colors.text, fontWeight: "600", fontSize: 14 },
  chipTon: { color: "#fff" },
  quick: {
    marginTop: space.md,
    padding: space.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
  quickT: { color: colors.primaryPressed, fontWeight: "700", fontSize: 14 },
  slot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotFilled: { borderColor: colors.borderFocus, backgroundColor: "#f0fdfa" },
  slotT: { color: colors.textSecondary, fontWeight: "600", fontSize: 14 },
  slotV: { color: colors.primary, flex: 1, textAlign: "right", marginLeft: space.md, fontWeight: "600", fontSize: 14 },
});
