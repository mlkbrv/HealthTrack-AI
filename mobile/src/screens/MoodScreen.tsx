import React, { useCallback, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { colors, layout, space, typography, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

type Row = { id: number; created_at: string; text: string };

export default function MoodScreen() {
  const { api } = useAuth();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [analysis, setAnalysis] = useState("");
  const inp = inputStyle();

  const load = useCallback(async () => {
    const { data } = await api.get<Row[]>("mood-entries/");
    setRows(data);
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionLabel style={{ marginTop: 0 }}>New entry</SectionLabel>
      <Card>
        <TextInput
          style={[inp, s.area]}
          multiline
          value={text}
          onChangeText={setText}
          placeholder="How are you feeling?"
          placeholderTextColor={colors.textMuted}
        />
        <Button
          title="Save entry"
          onPress={async () => {
            try {
              await api.post("mood-entries/", { text });
              setText("");
              await load();
              Alert.alert("Saved");
            } catch {
              Alert.alert("Error", "Could not save entry.");
            }
          }}
        />
        <View style={s.gap} />
        <Button
          variant="secondary"
          title="Analyze current text"
          onPress={async () => {
            if (!text.trim()) {
              Alert.alert("Enter text first.");
              return;
            }
            try {
              const { data } = await api.post<{ summary: string; themes: string[] }>("mood/analyze/", { text });
              setAnalysis(`${data.summary}\nThemes: ${(data.themes || []).join(", ")}`);
            } catch {
              Alert.alert("Analysis failed");
            }
          }}
        />
      </Card>
      {analysis ? (
        <Card>
          <Text style={typography.body}>{analysis}</Text>
        </Card>
      ) : null}
      <SectionLabel>Recent entries</SectionLabel>
      {rows.map((item) => (
        <View key={item.id} style={[s.entry, shadowSoft]}>
          <Text style={typography.caption}>{item.created_at.slice(0, 16)}</Text>
          <Text style={[typography.body, { color: colors.text, marginTop: space.xs }]}>{item.text}</Text>
          <Button
            variant="ghost"
            title="Analyze"
            onPress={async () => {
              try {
                const { data } = await api.post<{ summary: string; themes: string[] }>("mood/analyze/", {
                  text: item.text,
                });
                setAnalysis(`${data.summary}\nThemes: ${(data.themes || []).join(", ")}`);
              } catch {
                Alert.alert("Analysis failed");
              }
            }}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  area: { minHeight: 100, textAlignVertical: "top", marginBottom: space.md },
  gap: { height: space.sm },
  entry: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.md,
  },
});
