import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

function mondayISO(d = new Date()) {
  const x = new Date(d.getTime());
  const py = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - py);
  return x.toISOString().slice(0, 10);
}

type G = {
  items: { name: string; amount: string; unit: string; estimated_cost: string }[];
  estimated_total: string;
  weekly_budget: string;
  over_budget: boolean;
};

export default function GroceryScreen() {
  const { api } = useAuth();
  const [ws, setWs] = useState(mondayISO());
  const [data, setData] = useState<G | null>(null);
  const inp = inputStyle();

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionLabel style={{ marginTop: 0 }}>From meal plan</SectionLabel>
      <Card>
        <Text style={typography.label}>Week start</Text>
        <TextInput style={[inp, s.field]} value={ws} onChangeText={setWs} autoCapitalize="none" />
        <Button title="Load grocery list" onPress={async () => {
          const { data: g } = await api.get<G>("grocery/", { params: { week_start: ws } });
          setData(g);
        }} />
      </Card>
      {data ? (
        <>
          <Card style={[s.summary, data.over_budget && s.summaryWarn]}>
            <Text style={s.sumT}>
              Estimated {data.estimated_total} · Budget {data.weekly_budget}
              {data.over_budget ? " · Over budget" : ""}
            </Text>
          </Card>
          {data.items.map((it, idx) => (
            <View key={`${it.name}-${idx}`} style={[s.row, shadowSoft]}>
              <Text style={s.n}>{it.name}</Text>
              <Text style={typography.caption}>
                {it.amount} {it.unit} · {it.estimated_cost}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  field: { marginBottom: space.md },
  summary: { backgroundColor: colors.primaryMuted, borderColor: colors.borderFocus },
  summaryWarn: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  sumT: { fontWeight: "800", color: colors.text, fontSize: 15, lineHeight: 22 },
  row: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  n: { fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: space.xs },
});
