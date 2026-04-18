import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppColors, Radius, AppSpacing } from "@/constants/theme";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "outline";
}

export function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = "primary",
}: GradientButtonProps) {
  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.outlineBtn, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.75}
      >
        <Text style={styles.outlineLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.wrapper, style]}
    >
      <LinearGradient
        colors={
          variant === "secondary"
            ? [AppColors.accent, "#3BBDB5"]
            : [AppColors.primary, AppColors.primaryDark]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: AppSpacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: AppColors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: AppSpacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  outlineLabel: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
