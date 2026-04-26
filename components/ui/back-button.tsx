import { AppColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

interface BackButtonProps {
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function BackButton({ label = "Back", onPress, style }: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.7}
    >
      <Text style={styles.arrow}>←</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  arrow: {
    fontSize: 20,
    color: AppColors.primary,
    lineHeight: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primary,
  },
});
