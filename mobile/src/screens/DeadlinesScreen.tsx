import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

type D = { id: number; title: string; due_at: string; priority: number };

export default function DeadlinesScreen() {
  const { api } = useAuth();
  const [rows, setRows] = useState<D[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [pri, setPri] = useState("1");
  const inp = inputStyle();

  const load = useCallback(async () => {
    const { data } = await api.get<D[]>("deadlines/");
    setRows(data);
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionLabel style={{ marginTop: 0 }}>Add deadline</SectionLabel>
      <Card>
        <Text style={s.note}>Due as ISO, e.g. 2026-04-01T14:00:00Z</Text>
        <Text style={typography.label}>Title</Text>
        <TextInput style={[inp, s.field]} value={title} onChangeText={setTitle} />
        <Text style={typography.label}>Due at</Text>
        <TextInput style={[inp, s.field]} value={due} onChangeText={setDue} autoCapitalize="none" />
        <Text style={typography.label}>Priority (1 = highest)</Text>
        <TextInput style={[inp, s.field]} keyboardType="number-pad" value={pri} onChangeText={setPri} />
        <Button
          title="Add deadline"
          onPress={async () => {
            try {
              await api.post("deadlines/", {
                title,
                due_at: due,
                priority: parseInt(pri, 10) || 1,
              });
              setTitle("");
              setDue("");
              await load();
              Alert.alert("Saved");
            } catch {
              Alert.alert("Error", "Check ISO date format.");
            }
          }}
        />
      </Card>
      <SectionLabel>Upcoming</SectionLabel>
      {rows.map((r) => (
        <View key={r.id} style={[s.rowCard, shadowSoft]}>
          <View style={{ flex: 1 }}>
            <Text style={s.t}>{r.title}</Text>
            <Text style={typography.caption}>{r.due_at}</Text>
          </View>
          <Pressable
            onPress={async () => {
              await api.delete(`deadlines/${r.id}/`);
              await load();
            }}
          >
            <Text style={s.del}>Remove</Text>
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
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  t: { fontWeight: "700", color: colors.text, fontSize: 16 },
  del: { color: colors.danger, fontWeight: "700", fontSize: 15 },
});
