import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from "react-native";
import { colors, radius, space, shadowCard, typography } from "../theme";

type CardProps = { children: React.ReactNode; style?: StyleProp<ViewStyle> };

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type BtnProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};

export function Button({ title, onPress, disabled, variant = "primary", loading }: BtnProps) {
  const v =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "secondary"
        ? styles.btnSecondary
        : variant === "danger"
          ? styles.btnDanger
          : styles.btnGhost;
  const t =
    variant === "secondary" || variant === "ghost" ? styles.btnTextDark : styles.btnTextLight;
  return (
    <Pressable
      style={({ pressed }) => [styles.btnBase, v, (disabled || loading) && styles.btnDisabled, pressed && styles.btnPressed]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : colors.primary} />
      ) : (
        <Text style={[typography.button, t]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  btnBase: {
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  btnDanger: { backgroundColor: colors.danger },
  btnGhost: { backgroundColor: "transparent" },
  btnTextLight: { color: "#fff" },
  btnTextDark: { color: colors.primary },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.88 },
  sectionLabel: {
    ...typography.h2,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
});

export function inputStyle(): TextStyle {
  return {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  };
}
