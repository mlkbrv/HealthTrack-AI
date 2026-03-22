import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";
import type { HealthStackParamList } from "../navigation/types";

export default function WellnessScreen() {
  const { api } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<HealthStackParamList>>();
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().slice(0, 10));
  const [sleepH, setSleepH] = useState("7");
  const [stress, setStress] = useState("3");
  const [stressNote, setStressNote] = useState("");
  const [waterDate, setWaterDate] = useState(new Date().toISOString().slice(0, 10));
  const [glasses, setGlasses] = useState("6");
  const inp = inputStyle();
  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <Pressable style={({ pressed }) => [s.moodBanner, shadowSoft, pressed && { opacity: 0.92 }]} onPress={() => nav.navigate("Mood")}>
        <View style={s.moodIcon}>
          <Ionicons name="heart-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moodTitle}>Mood journal</Text>
          <Text style={s.moodSub}>Write a line or run analysis — same tab, one tap</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
      <SectionLabel style={{ marginTop: 0 }}>Sleep</SectionLabel>
      <Card>
        <Text style={typography.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={[inp, s.field]} value={sleepDate} onChangeText={setSleepDate} />
        <Text style={typography.label}>Hours slept</Text>
        <TextInput style={[inp, s.field]} keyboardType="decimal-pad" value={sleepH} onChangeText={setSleepH} />
        <Button
          title="Save sleep"
          onPress={async () => {
            try {
              await api.post("sleep-entries/", { date: sleepDate, hours_slept: parseFloat(sleepH) || 0 });
              Alert.alert("Saved", "Sleep entry saved.");
            } catch {
              Alert.alert("Error", "Could not save sleep entry.");
            }
          }}
        />
      </Card>
      <SectionLabel>Stress (1–5)</SectionLabel>
      <Card>
        <Text style={typography.label}>Level</Text>
        <TextInput style={[inp, s.field]} keyboardType="number-pad" value={stress} onChangeText={setStress} />
        <Text style={typography.label}>Note (optional)</Text>
        <TextInput style={[inp, s.field]} value={stressNote} onChangeText={setStressNote} />
        <Button
          title="Save stress"
          onPress={async () => {
            const n = Math.min(5, Math.max(1, parseInt(stress, 10) || 3));
            try {
              await api.post("stress-entries/", { level: n, note: stressNote });
              Alert.alert("Saved", "Stress entry saved.");
            } catch {
              Alert.alert("Error", "Could not save stress entry.");
            }
          }}
        />
      </Card>
      <SectionLabel>Water</SectionLabel>
      <Card>
        <Text style={typography.label}>Date</Text>
        <TextInput style={[inp, s.field]} value={waterDate} onChangeText={setWaterDate} />
        <Text style={typography.label}>Glasses per day</Text>
        <TextInput style={[inp, s.field]} keyboardType="number-pad" value={glasses} onChangeText={setGlasses} />
        <Button
          title="Save water"
          onPress={async () => {
            try {
              await api.post("water-entries/", { date: waterDate, glasses: parseInt(glasses, 10) || 0 });
              Alert.alert("Saved", "Water entry saved.");
            } catch {
              Alert.alert("Error", "Could not save water entry.");
            }
          }}
        />
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  field: { marginBottom: space.md },
  moodBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md,
  },
  moodTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  moodSub: { ...typography.caption, marginTop: 2 },
});
