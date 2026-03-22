import { Platform, StyleSheet } from "react-native";

export const colors = {
  bg: "#eef2f6",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  borderFocus: "#99f6e4",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  primary: "#0d9488",
  primaryPressed: "#0f766e",
  primaryMuted: "#ccfbf1",
  accent: "#f59e0b",
  danger: "#dc2626",
  dangerSurface: "#fef2f2",
  success: "#059669",
  successMuted: "#d1fae5",
  chatUser: "#0d9488",
  chatBot: "#e2e8f0",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, full: 9999 };

export const space = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 };

export const shadowCard = Platform.select({
  ios: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
  default: {},
});

export const shadowSoft = Platform.select({
  ios: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
});

export const typography = StyleSheet.create({
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.88)", marginTop: 6, fontWeight: "500" },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: space.xs },
  button: { fontSize: 16, fontWeight: "700" },
});

export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenPadded: { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  scrollContent: { padding: space.lg, paddingBottom: 48 },
});
