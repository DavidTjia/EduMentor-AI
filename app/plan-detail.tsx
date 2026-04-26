import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { useColors } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PlanDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    planId: string; topic: string; description: string; estimatedTime: string;
  }>();

  const { topic, description, estimatedTime } = params;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}><BackButton label="Home" onPress={() => router.push("/(tabs)/home")} /></View>

      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>TODAY'S PLAN</Text></View>
        <Text style={styles.heroEmoji}>📖</Text>
        <Text style={styles.heroTitle}>{topic}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaChip}><Text style={styles.metaChipText}>⏱ {estimatedTime} min</Text></View>
          <View style={styles.metaChip}><Text style={styles.metaChipText}>🐍 Python</Text></View>
        </View>
      </LinearGradient>

      <Card style={styles.descCard}>
        <View style={styles.descHeader}><Text style={styles.descIcon}>📋</Text><Text style={styles.descTitle}>What you'll learn</Text></View>
        <Text style={styles.descText}>{description}</Text>
      </Card>

      <Card style={styles.pathCard}>
        <Text style={styles.pathTitle}>Lesson Structure</Text>
        {[
          { step: 1, label: "Read explanation", icon: "💡" },
          { step: 2, label: "Study code example", icon: "🐍" },
          { step: 3, label: "Ask AI if needed", icon: "✦" },
          { step: 4, label: "Take the quiz", icon: "🧩" },
          { step: 5, label: "See your result", icon: "✅" },
        ].map((item) => (
          <View key={item.step} style={styles.pathRow}>
            <View style={styles.pathNum}><Text style={styles.pathNumText}>{item.step}</Text></View>
            <Text style={styles.pathIcon}>{item.icon}</Text>
            <Text style={styles.pathLabel}>{item.label}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Learning Tips</Text>
        <Text style={styles.tipText}>
          • Take your time reading the explanation before jumping to the quiz.{"\n"}
          • Try to understand the code example — run it mentally.{"\n"}
          • Use the Ask AI button freely — there are no silly questions!
        </Text>
      </Card>

      <GradientButton label="Start Learning →" onPress={() => router.push("/(tabs)/learning")} style={styles.cta} />
      <GradientButton label="Back to Home" onPress={() => router.push("/(tabs)/home")} variant="outline" style={styles.cta} />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
    topBar: { paddingHorizontal: AppSpacing.lg, paddingTop: 56 },
    hero: { padding: AppSpacing.lg, paddingTop: AppSpacing.md, paddingBottom: AppSpacing.xl, alignItems: "center", gap: 10 },
    heroBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 12 },
    heroBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
    heroEmoji: { fontSize: 52 },
    heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 34 },
    heroMeta: { flexDirection: "row", gap: 10 },
    metaChip: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14 },
    metaChipText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    descCard: { marginHorizontal: AppSpacing.lg, gap: 10 },
    descHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    descIcon: { fontSize: 18 },
    descTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    descText: { fontSize: 14, lineHeight: 22, color: c.textSecondary },
    pathCard: { marginHorizontal: AppSpacing.lg, gap: 12 },
    pathTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    pathRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    pathNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.primaryLight, alignItems: "center", justifyContent: "center" },
    pathNumText: { fontSize: 12, fontWeight: "700", color: c.primary },
    pathIcon: { fontSize: 16 },
    pathLabel: { fontSize: 14, color: c.textSecondary, fontWeight: "500" },
    tipCard: { marginHorizontal: AppSpacing.lg, gap: 8, borderLeftWidth: 4, borderLeftColor: c.warning },
    tipTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    tipText: { fontSize: 13, color: c.textSecondary, lineHeight: 22 },
    cta: { marginHorizontal: AppSpacing.lg },
  });
}
