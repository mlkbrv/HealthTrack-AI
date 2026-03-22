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
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AppNavigator";
import { getApiUrl } from "../config";
import { colors, radius, space, typography, shadowCard } from "../theme";
import { Button, inputStyle } from "../components/ui";

type P = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: P) {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [u, setU] = useState("");
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
        <View style={[styles.hero, { paddingTop: insets.top + space.xl }]}>
          <Text style={typography.heroTitle}>HealthTrack AI</Text>
          <Text style={typography.heroSub}>Wellness built for busy students</Text>
        </View>
        <View style={[styles.sheet, shadowCard]}>
          <Text style={styles.sheetTitle}>Sign in</Text>
          <Text style={styles.sheetHint}>Use your campus routine — sleep, stress, meals in one place.</Text>
          <Text style={typography.label}>Username</Text>
          <TextInput
            style={[inputStyle(), styles.inputSp]}
            autoCapitalize="none"
            value={u}
            onChangeText={setU}
            placeholder="username"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[typography.label, styles.labelSp]}>Password</Text>
          <TextInput
            style={inputStyle()}
            secureTextEntry
            value={p}
            onChangeText={setP}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.btnSp}>
            <Button
              title="Sign in"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await signIn(u, p);
                } catch (e) {
                  if (axios.isAxiosError(e)) {
                    if (!e.response) {
                      Alert.alert(
                        "Cannot reach server",
                        `No response from ${getApiUrl()}. Check Wi‑Fi and Django (0.0.0.0:8000).`
                      );
                    } else if (e.response.status === 401) {
                      Alert.alert("Sign in failed", "Wrong username or password.");
                    } else {
                      const d = e.response.data as { detail?: string; non_field_errors?: string[] };
                      const msg =
                        d?.detail || d?.non_field_errors?.join(" ") || `HTTP ${e.response.status}`;
                      Alert.alert("Sign in failed", String(msg));
                    }
                  } else {
                    Alert.alert("Sign in failed", "Something went wrong.");
                  }
                } finally {
                  setBusy(false);
                }
              }}
            />
          </View>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Create an account</Text>
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
    backgroundColor: colors.primary,
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
  sheetTitle: { ...typography.h1, marginBottom: space.xs },
  sheetHint: { ...typography.body, marginBottom: space.lg },
  inputSp: { marginBottom: 0 },
  labelSp: { marginTop: space.md },
  btnSp: { marginTop: space.lg },
  linkRow: { marginTop: space.lg, alignItems: "center", padding: space.sm },
  link: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
