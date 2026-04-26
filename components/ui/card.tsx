import { useColors } from "@/constants/ThemeContext";
import { Radius } from "@/constants/theme";
import React, { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    padded: {
      padding: 20,
    },
  }), [colors]);

  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}
