import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AppNavigator";
import { colors, radius, space, typography, shadowCard } from "../theme";
import { Button, inputStyle } from "../components/ui";

type P = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: P) {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [u, setU] = useState("");
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + space.lg }]}>
          <Text style={typography.heroTitle}>Join HealthTrack</Text>
          <Text style={typography.heroSub}>Track habits without the clutter</Text>
        </View>
        <View style={[styles.sheet, shadowCard]}>
          <Text style={styles.sheetTitle}>Create account</Text>
          <Text style={typography.label}>Username</Text>
          <TextInput
            style={[inputStyle(), styles.gap]}
            autoCapitalize="none"
            value={u}
            onChangeText={setU}
            placeholder="pick a username"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={typography.label}>Email (optional)</Text>
          <TextInput
            style={[inputStyle(), styles.gap]}
            autoCapitalize="none"
            keyboardType="email-address"
            value={e}
            onChangeText={setE}
            placeholder="you@university.edu"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={typography.label}>Password (min 8)</Text>
          <TextInput
            style={inputStyle()}
            secureTextEntry
            value={p}
            onChangeText={setP}
            placeholder="at least 8 characters"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.btnSp}>
            <Button
              title="Create account"
              loading={busy}
              onPress={async () => {
                if (p.length < 8) {
                  Alert.alert("Password too short");
                  return;
                }
                setBusy(true);
                try {
                  await signUp(u, p, e || undefined);
                } catch {
                  Alert.alert("Registration failed", "Try a different username.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </View>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: colors.primaryPressed,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl * 2,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  sheet: {
    marginTop: -space.xl * 1.5,
    marginHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: { ...typography.h1, marginBottom: space.lg },
  gap: { marginBottom: space.md },
  btnSp: { marginTop: space.lg },
  linkRow: { marginTop: space.md, alignItems: "center", padding: space.sm },
  link: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
