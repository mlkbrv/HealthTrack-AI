import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

type B = { id: number; weekday: number; start_time: string; end_time: string };

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ScheduleScreen() {
  const { api } = useAuth();
  const [rows, setRows] = useState<B[]>([]);
  const [wd, setWd] = useState("0");
  const [st, setSt] = useState("09:00");
  const [et, setEt] = useState("10:30");
  const inp = inputStyle();

  const load = useCallback(async () => {
    const { data } = await api.get<B[]>("class-blocks/");
    setRows(data);
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={s.note}>Weekday 0 = Monday … 6 = Sunday.</Text>
        <Text style={typography.label}>Weekday (0–6)</Text>
        <TextInput style={[inp, s.field]} keyboardType="number-pad" value={wd} onChangeText={setWd} />
        <Text style={typography.label}>Start (HH:MM)</Text>
        <TextInput style={[inp, s.field]} value={st} onChangeText={setSt} />
        <Text style={typography.label}>End (HH:MM)</Text>
        <TextInput style={[inp, s.field]} value={et} onChangeText={setEt} />
        <Button
          title="Add class block"
          onPress={async () => {
            const pad = (x: string) => (x.length === 5 ? `${x}:00` : x);
            try {
              await api.post("class-blocks/", {
                weekday: parseInt(wd, 10) || 0,
                start_time: pad(st),
                end_time: pad(et),
              });
              await load();
              Alert.alert("Added");
            } catch {
              Alert.alert("Error", "Could not add block.");
            }
          }}
        />
      </Card>
      <SectionLabel style={{ marginTop: space.xl }}>Your blocks</SectionLabel>
      {rows.map((r) => (
        <View key={r.id} style={[s.rowCard, shadowSoft]}>
          <Text style={s.rowT}>
            {days[r.weekday] ?? r.weekday} {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
          </Text>
          <Pressable
            style={s.del}
            onPress={async () => {
              await api.delete(`class-blocks/${r.id}/`);
              await load();
            }}
          >
            <Text style={s.delT}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  note: { ...typography.caption, marginBottom: space.md },
  field: { marginBottom: space.md },
  rowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowT: { color: colors.text, fontWeight: "600", flex: 1, fontSize: 15 },
  del: { padding: space.sm },
  delT: { color: colors.danger, fontWeight: "700", fontSize: 15 },
});
