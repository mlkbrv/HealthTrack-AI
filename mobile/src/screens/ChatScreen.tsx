import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, space, typography, radius } from "../theme";
import { inputStyle } from "../components/ui";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatScreen() {
  const { api } = useAuth();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ask about sleep, stress, budget meals, or focus. Not a substitute for medical care.",
    },
  ]);
  const inp = inputStyle();

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.log} showsVerticalScrollIndicator={false}>
        {msgs.map((m, i) => (
          <View key={i} style={[s.bub, m.role === "user" ? s.u : s.a]}>
            <Text style={m.role === "user" ? s.ut : s.at}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={s.bar}>
        <TextInput
          style={[inp, s.in]}
          value={input}
          onChangeText={setInput}
          placeholder="Message"
          placeholderTextColor={colors.textMuted}
        />
        <Pressable
          style={s.send}
          onPress={async () => {
            const t = input.trim();
            if (!t) return;
            setInput("");
            setMsgs((m) => [...m, { role: "user", text: t }]);
            try {
              const { data } = await api.post<{ reply: string }>("chat/", { message: t });
              setMsgs((m) => [...m, { role: "assistant", text: data.reply }]);
            } catch {
              setMsgs((m) => [...m, { role: "assistant", text: "Request failed. Try again later." }]);
            }
          }}
        >
          <Text style={s.st}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  log: { padding: space.lg, paddingBottom: space.md },
  bub: { maxWidth: "92%", padding: space.md, borderRadius: radius.lg, marginBottom: space.sm },
  u: { alignSelf: "flex-end", backgroundColor: colors.chatUser },
  a: { alignSelf: "flex-start", backgroundColor: colors.chatBot },
  ut: { color: "#fff", fontSize: 15, lineHeight: 22 },
  at: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  in: { flex: 1, marginRight: space.sm, marginBottom: 0 },
  send: { justifyContent: "center", paddingHorizontal: space.md, paddingVertical: space.sm },
  st: { color: colors.primary, fontWeight: "800", fontSize: 16 },
});
