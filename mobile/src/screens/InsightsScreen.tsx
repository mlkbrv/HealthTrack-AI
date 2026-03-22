import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel } from "../components/ui";
import type { CoachStackParamList } from "../navigation/types";

export default function InsightsScreen() {
  const { api } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<CoachStackParamList>>();
  const [burn, setBurn] = useState<Record<string, unknown> | null>(null);
  const [slots, setSlots] = useState<Record<string, string> | null>(null);
  const [rec, setRec] = useState("");
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [recBusy, setRecBusy] = useState(false);

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <Pressable style={({ pressed }) => [s.chatBanner, shadowSoft, pressed && { opacity: 0.92 }]} onPress={() => nav.navigate("Chat")}>
        <View style={s.chatIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.chatTitle}>Assistant chat</Text>
          <Text style={s.chatSub}>Ask about sleep, meals, focus — one tap</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
      <SectionLabel style={{ marginTop: 0 }}>Wellness signals</SectionLabel>
      <Button
        title="Refresh insights"
        loading={refreshBusy}
        onPress={async () => {
          setRefreshBusy(true);
          try {
            const { data } = await api.get("insights/burnout-risk/");
            setBurn(data as Record<string, unknown>);
            const { data: sl } = await api.get("insights/slot-suggestions/");
            setSlots(sl as Record<string, string>);
          } finally {
            setRefreshBusy(false);
          }
        }}
      />
      {burn ? (
        <Card style={s.cardGap}>
          <Text style={s.tag}>Burnout risk: {String(burn.level)}</Text>
          <Text style={typography.body}>{String(burn.message)}</Text>
          {burn.sleep_tips_short_night ? (
            <Text style={[typography.caption, s.tip]}>{String(burn.sleep_tips_short_night)}</Text>
          ) : null}
        </Card>
      ) : null}
      {slots ? (
        <Card>
          <Text style={s.tag}>Schedule hints</Text>
          {Object.entries(slots).map(([k, v]) => (
            <Text key={k} style={[typography.body, s.line]}>
              {k}: {v}
            </Text>
          ))}
        </Card>
      ) : null}
      <SectionLabel>Recommendations</SectionLabel>
      <Button
        variant="secondary"
        title="Load AI recommendations"
        loading={recBusy}
        onPress={async () => {
          setRecBusy(true);
          try {
            const { data } = await api.get<{ text: string }>("recommendations/");
            setRec(data.text);
          } finally {
            setRecBusy(false);
          }
        }}
      />
      {rec ? (
        <Card style={s.cardGap}>
          <Text style={typography.body}>{rec}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  chatBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md,
  },
  chatTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  chatSub: { ...typography.caption, marginTop: 2 },
  cardGap: { marginTop: space.md },
  tag: { fontWeight: "800", color: colors.primary, fontSize: 15, marginBottom: space.sm },
  tip: { marginTop: space.md, color: colors.textSecondary },
  line: { marginTop: space.xs },
});
