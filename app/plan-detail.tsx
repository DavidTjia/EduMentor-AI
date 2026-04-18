import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function PlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId: string;
    topic: string;
    description: string;
    estimatedTime: string;
  }>();

  const { topic, description, estimatedTime } = params;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <View style={styles.topBar}>
        <BackButton label="Home" onPress={() => router.push("/(tabs)/home")} />
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>TODAY'S PLAN</Text>
        </View>
        <Text style={styles.heroEmoji}>📖</Text>
        <Text style={styles.heroTitle}>{topic}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>⏱ {estimatedTime} min</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>🐍 Python</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Description card */}
      <Card style={styles.descCard}>
        <View style={styles.descHeader}>
          <Text style={styles.descIcon}>📋</Text>
          <Text style={styles.descTitle}>What you'll learn</Text>
        </View>
        <Text style={styles.descText}>{description}</Text>
      </Card>

      {/* Learning path */}
      <Card style={styles.pathCard}>
        <Text style={styles.pathTitle}>Lesson Structure</Text>
        {[
          { step: 1, label: "Read explanation", icon: "💡", done: false },
          { step: 2, label: "Study code example", icon: "🐍", done: false },
          { step: 3, label: "Ask AI if needed", icon: "✦", done: false },
          { step: 4, label: "Take the quiz", icon: "🧩", done: false },
          { step: 5, label: "See your result", icon: "✅", done: false },
        ].map((item) => (
          <View key={item.step} style={styles.pathRow}>
            <View style={styles.pathNum}>
              <Text style={styles.pathNumText}>{item.step}</Text>
            </View>
            <Text style={styles.pathIcon}>{item.icon}</Text>
            <Text style={styles.pathLabel}>{item.label}</Text>
          </View>
        ))}
      </Card>

      {/* Tips */}
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Learning Tips</Text>
        <Text style={styles.tipText}>
          • Take your time reading the explanation before jumping to the quiz.{"\n"}
          • Try to understand the code example — run it mentally.{"\n"}
          • Use the Ask AI button freely — there are no silly questions!
        </Text>
      </Card>

      {/* CTA */}
      <GradientButton
        label="Start Learning →"
        onPress={() => router.push("/(tabs)/learning")}
        style={styles.cta}
      />

      <GradientButton
        label="Back to Home"
        onPress={() => router.push("/(tabs)/home")}
        variant="outline"
        style={styles.cta}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
  topBar: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: 56,
  },
  hero: {
    padding: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.xl,
    alignItems: "center",
    gap: 10,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroEmoji: { fontSize: 52 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 34,
  },
  heroMeta: { flexDirection: "row", gap: 10 },
  metaChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  metaChipText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  descCard: {
    marginHorizontal: AppSpacing.lg,
    gap: 10,
  },
  descHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  descIcon: { fontSize: 18 },
  descTitle: { fontSize: 16, fontWeight: "700", color: AppColors.text },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.textSecondary,
  },
  pathCard: {
    marginHorizontal: AppSpacing.lg,
    gap: 12,
  },
  pathTitle: { fontSize: 16, fontWeight: "700", color: AppColors.text },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pathNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pathNumText: { fontSize: 12, fontWeight: "700", color: AppColors.primary },
  pathIcon: { fontSize: 16 },
  pathLabel: { fontSize: 14, color: AppColors.textSecondary, fontWeight: "500" },
  tipCard: {
    marginHorizontal: AppSpacing.lg,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.warning,
  },
  tipTitle: { fontSize: 14, fontWeight: "700", color: AppColors.text },
  tipText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 22,
  },
  cta: { marginHorizontal: AppSpacing.lg },
});
