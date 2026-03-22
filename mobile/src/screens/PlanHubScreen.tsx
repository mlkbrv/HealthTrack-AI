import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { PlanStackParamList } from "../navigation/types";
import { colors, radius, space, typography, shadowSoft } from "../theme";

type P = NativeStackScreenProps<PlanStackParamList, "PlanHome">;

const items: {
  t: string;
  s: keyof Omit<PlanStackParamList, "PlanHome">;
  icon: keyof typeof Ionicons.glyphMap;
  sub: string;
}[] = [
  { t: "Class schedule", s: "Schedule", icon: "calendar-outline", sub: "Blocks & quiet hours" },
  { t: "Deadlines", s: "Deadlines", icon: "flag-outline", sub: "Due dates & priorities" },
  { t: "Meals & plan", s: "Meals", icon: "restaurant-outline", sub: "Weekly meal slots" },
  { t: "Grocery list", s: "Grocery", icon: "cart-outline", sub: "From plan vs budget" },
];

export default function PlanHubScreen({ navigation }: P) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.lead}>Pick where to go — everything for your week in one place.</Text>
      {items.map((it) => (
        <Pressable
          key={it.s}
          style={({ pressed }) => [s.card, shadowSoft, pressed && { opacity: 0.92 }]}
          onPress={() => navigation.navigate(it.s)}
        >
          <View style={s.iconWrap}>
            <Ionicons name={it.icon} size={26} color={colors.primary} />
          </View>
          <View style={s.textWrap}>
            <Text style={s.title}>{it.t}</Text>
            <Text style={s.sub}>{it.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.lg, paddingBottom: 48 },
  lead: { ...typography.body, marginBottom: space.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  sub: { ...typography.caption, marginTop: 4 },
});
