import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CycleResultScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("edumentor_user_id").then((id) => {
      if (id) setUserId(id as Id<"users">);
      else router.replace("/login");
    });
  }, []);

  const progressList = useQuery(
    api.progress.getUserProgress,
    userId ? { userId } : "skip"
  );
  const allPlans = useQuery(
    api.learningPlans.getAllUserPlans,
    userId ? { userId } : "skip"
  );

  const totalTopics = allPlans?.length ?? 0;
  const completedTopics = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const completionPct =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const passedTopics = progressList?.filter((p) => p.is_passed) ?? [];
  const failedTopics = progressList?.filter((p) => !p.is_passed) ?? [];

  if (!progressList || !allPlans) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={[AppColors.primary, "#8B80FF"]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroEmoji}>
          {completionPct >= 80 ? "🏆" : completionPct >= 50 ? "🎯" : "💪"}
        </Text>
        <Text style={styles.heroTitle}>
          {completionPct >= 80
            ? "Great Job!"
            : completionPct >= 50
              ? "Good Progress!"
              : "Keep Going!"}
        </Text>
        <Text style={styles.heroSub}>Cycle 1 completed</Text>

        {/* Big percentage */}
        <View style={styles.pctCircle}>
          <Text style={styles.pctValue}>{completionPct}%</Text>
          <Text style={styles.pctLabel}>Completion</Text>
        </View>

        <View style={styles.heroProgressWrap}>
          <View style={styles.heroProgressTrack}>
            <View
              style={[
                styles.heroProgressFill,
                { width: `${completionPct}%` },
              ]}
            />
          </View>
          <Text style={styles.heroProgressText}>
            {completedTopics} / {totalTopics} topics
          </Text>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: "Strong", value: passedTopics.length, emoji: "💚" },
          { label: "Weak", value: failedTopics.length, emoji: "🔴" },
          { label: "Total", value: totalTopics, emoji: "📚" },
        ].map((s, i, arr) => (
          <View
            key={s.label}
            style={[
              styles.statItem,
              i < arr.length - 1 && styles.statItemBorder,
            ]}
          >
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Strong topics */}
      {passedTopics.length > 0 && (
        <Card style={styles.topicsCard}>
          <Text style={styles.topicsTitle}>💚 Strong Topics</Text>
          {passedTopics.map((t) => (
            <View key={t._id} style={styles.topicRow}>
              <Text style={styles.topicDot}>✓</Text>
              <Text style={styles.topicItemName} numberOfLines={1}>
                {t.topic}
              </Text>
              <View style={styles.scoreBadgePass}>
                <Text style={styles.scoreBadgeText}>{t.score}%</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Weak topics */}
      {failedTopics.length > 0 && (
        <Card style={styles.topicsCard}>
          <Text style={[styles.topicsTitle, styles.weakTitle]}>
            🔴 Weak Topics — Need Review
          </Text>
          {failedTopics.map((t) => (
            <View key={t._id} style={styles.topicRow}>
              <Text style={styles.topicDotWeak}>!</Text>
              <Text style={styles.topicItemName} numberOfLines={1}>
                {t.topic}
              </Text>
              <View style={styles.scoreBadgeFail}>
                <Text style={[styles.scoreBadgeText, styles.scoreTextFail]}>
                  {t.score}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {failedTopics.length > 0 && (
          <GradientButton
            label="Review Weak Topics →"
            onPress={() => router.push("/(tabs)/learning")}
            variant="secondary"
          />
        )}
        <GradientButton
          label="Continue Learning →"
          onPress={() => router.replace("/ai-planning")}
        />
        <GradientButton
          label="Pause Learning"
          onPress={() => router.replace("/(tabs)/home")}
          variant="outline"
        />
      </View>

      {/* Motivational message */}
      <Card style={styles.motivCard}>
        <Text style={styles.motivText}>
          {completionPct >= 80
            ? "🌟 Excellent work! You've mastered the fundamentals. Your AI agent is preparing a more advanced plan for you."
            : completionPct >= 50
              ? "🚀 Great progress! Review the weak topics and you'll be ready for the next level."
              : "💡 Every expert was once a beginner. Review the material, ask the AI tutor, and try again!"}
        </Text>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: AppColors.background },
  hero: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: AppSpacing.xl,
    gap: 10,
    paddingHorizontal: AppSpacing.lg,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  pctCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  pctValue: { fontSize: 30, fontWeight: "800", color: "#fff" },
  pctLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  heroProgressWrap: { width: "100%", gap: 6 },
  heroProgressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  heroProgressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
  heroProgressText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "right",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: AppColors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: AppSpacing.lg,
    marginTop: -20,
    paddingVertical: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statItemBorder: { borderRightWidth: 1, borderRightColor: AppColors.border },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: "800", color: AppColors.primary },
  statLabel: { fontSize: 10, color: AppColors.textMuted, fontWeight: "500" },
  topicsCard: { marginHorizontal: AppSpacing.lg, gap: 10 },
  topicsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.success,
    marginBottom: 2,
  },
  weakTitle: { color: AppColors.danger },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  topicDot: { fontSize: 14, color: AppColors.success, fontWeight: "700", width: 20 },
  topicDotWeak: { fontSize: 14, color: AppColors.danger, fontWeight: "700", width: 20 },
  topicItemName: { flex: 1, fontSize: 14, color: AppColors.text, fontWeight: "500" },
  scoreBadgePass: {
    backgroundColor: "#E6F9EE",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  scoreBadgeFail: {
    backgroundColor: "#FFF0F0",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  scoreBadgeText: { fontSize: 12, fontWeight: "700", color: AppColors.success },
  scoreTextFail: { color: AppColors.danger },
  actions: {
    paddingHorizontal: AppSpacing.lg,
    gap: 12,
  },
  motivCard: {
    marginHorizontal: AppSpacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  motivText: { fontSize: 14, lineHeight: 22, color: AppColors.textSecondary },
});
