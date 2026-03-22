import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  scheduleHydrationFromServer,
  isAndroidExpoGoNoNotifications,
  HYDRATION_UNSUPPORTED_EXPO_GO_ANDROID,
} from "../utils/hydrationSchedule";
import { colors, layout, space, typography, radius } from "../theme";
import { Card, Button, SectionLabel, inputStyle } from "../components/ui";

export default function SettingsScreen() {
  const { profile, api, refreshProfile, signOut } = useAuth();
  const [budget, setBudget] = useState("50");
  const [uni, setUni] = useState("");
  const inp = inputStyle();
  const noHydration = isAndroidExpoGoNoNotifications();

  useEffect(() => {
    if (profile) {
      setBudget(String(profile.weekly_budget));
      setUni(profile.university_slug || "");
    }
  }, [profile]);

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={typography.body}>
          HealthTrack AI supports wellness habits only. It is not medical advice. In crisis, contact emergency services
          or your campus crisis line.
        </Text>
        <Pressable style={s.link} onPress={() => Linking.openURL("https://findahelpline.com/")}>
          <Text style={s.linkT}>Find a helpline</Text>
        </Pressable>
      </Card>
      <SectionLabel style={{ marginTop: space.xl }}>Profile</SectionLabel>
      <Card>
        <Text style={typography.label}>Weekly grocery budget</Text>
        <TextInput style={[inp, s.field]} keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
        <Text style={typography.label}>University slug (optional)</Text>
        <TextInput style={[inp, s.field]} value={uni} onChangeText={setUni} autoCapitalize="none" />
        <Button
          title="Save profile"
          onPress={async () => {
            try {
              await api.patch("profile/me/", { weekly_budget: budget, university_slug: uni });
              await refreshProfile();
              Alert.alert("Saved");
            } catch {
              Alert.alert("Error", "Could not update profile.");
            }
          }}
        />
      </Card>
      {noHydration ? (
        <View style={s.warn}>
          <Text style={s.warnT}>{HYDRATION_UNSUPPORTED_EXPO_GO_ANDROID}</Text>
        </View>
      ) : null}
      <Button
        variant="secondary"
        title="Schedule hydration reminders"
        disabled={noHydration}
        onPress={async () => {
          try {
            const n = await scheduleHydrationFromServer(api);
            if (n < 0) {
              Alert.alert("Not available", HYDRATION_UNSUPPORTED_EXPO_GO_ANDROID);
              return;
            }
            Alert.alert("Scheduled", `${n} hydration reminders (next 7 days, outside class blocks).`);
          } catch {
            Alert.alert("Notifications", "Permission denied or scheduling failed.");
          }
        }}
      />
      <Text style={s.hint}>
        Uses class blocks from Schedule. Reschedule after you change blocks. OS limits may apply.
      </Text>
      <Button variant="danger" title="Sign out" onPress={() => signOut()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  field: { marginBottom: space.md },
  link: { marginTop: space.md },
  linkT: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  warn: {
    marginTop: space.md,
    padding: space.md,
    backgroundColor: "#fff7ed",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warnT: { color: "#c2410c", lineHeight: 20, fontSize: 13 },
  hint: { marginTop: space.sm, marginBottom: space.lg, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
