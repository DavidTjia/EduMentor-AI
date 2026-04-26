import { useColors } from "@/constants/ThemeContext";
import { Radius } from "@/constants/theme";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  height?: number;
  showPercent?: boolean;
}

export function ProgressBar({
  progress,
  label,
  height = 10,
  showPercent = false,
}: ProgressBarProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const styles = useMemo(() => StyleSheet.create({
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    percent: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "700",
    },
    track: {
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.full,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: colors.primary,
      borderRadius: Radius.full,
    },
  }), [colors]);

  return (
    <View>
      {(label || showPercent) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercent && (
            <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterpolated, height },
          ]}
        />
      </View>
    </View>
  );
}
