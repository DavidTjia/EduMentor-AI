import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
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

export default function ProgressScreen() {
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

  const sessions = useQuery(
    api.learningSessions.getSessionsByUser,
    userId ? { userId } : "skip"
  );

  const totalTopics = allPlans?.length ?? 0;
  const completedTopics = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const passedQuizzes = progressList?.filter((p) => p.is_passed).length ?? 0;
  const totalAttempts = progressList?.reduce((s, p) => s + p.attempt, 0) ?? 0;
  const avgScore =
    progressList && progressList.length > 0
      ? Math.round(
        progressList.reduce((s, p) => s + p.score, 0) / progressList.length
      )
      : 0;

  const isLoading = progressList === undefined || allPlans === undefined;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[AppColors.accent, "#3BBDB5"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerLabel}>YOUR PROGRESS</Text>
        <Text style={styles.headerTitle}>Learning Journey</Text>
        <Text style={styles.headerSub}>
          Track your Python mastery step by step
        </Text>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            {[
              { label: "Topics Done", value: completedTopics, emoji: "📚" },
              { label: "Quizzes Passed", value: passedQuizzes, emoji: "✅" },
              { label: "Avg Score", value: `${avgScore}%`, emoji: "🏆" },
              { label: "Total Attempts", value: totalAttempts, emoji: "🔄" },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard} padded={false}>
                <View style={styles.statInner}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Overall Progress */}
          <Card style={styles.overallCard}>
            <Text style={styles.sectionTitle}>Overall Completion</Text>
            <ProgressBar
              progress={totalTopics > 0 ? completedTopics / totalTopics : 0}
              label={`${completedTopics} of ${totalTopics} topics`}
              showPercent
            />
          </Card>

          {/* Topic Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topic Scores</Text>

            {progressList && progressList.length > 0 ? (
              progressList.map((item) => (
                <Card key={item._id} style={styles.topicCard}>
                  <View style={styles.topicHeader}>
                    <View style={styles.topicMeta}>
                      <Text style={styles.topicName} numberOfLines={1}>
                        {item.topic}
                      </Text>
                      <Text style={styles.topicAttempt}>
                        {item.attempt} attempt{item.attempt !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.scoreBadge,
                        item.is_passed ? styles.scoreBadgePass : styles.scoreBadgeFail,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreText,
                          item.is_passed
                            ? styles.scoreTextPass
                            : styles.scoreTextFail,
                        ]}
                      >
                        {item.score}%
                      </Text>
                    </View>
                  </View>
                  <ProgressBar
                    progress={item.score / 100}
                    height={6}
                  />
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        item.is_passed
                          ? styles.statusDotPass
                          : styles.statusDotFail,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        item.is_passed
                          ? styles.statusTextPass
                          : styles.statusTextFail,
                      ]}
                    >
                      {item.is_passed ? "Passed" : "Needs Review"}
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyTitle}>No quiz results yet</Text>
                <Text style={styles.emptySub}>
                  Complete your first lesson to see scores here.
                </Text>
              </Card>
            )}
          </View>

          {/* Plan list also shown */}
          {allPlans && allPlans.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Topics</Text>
              {allPlans.map((plan, idx) => (
                <View key={plan._id} style={styles.planRow}>
                  <View
                    style={[
                      styles.stepNum,
                      plan.is_completed && styles.stepNumDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumText,
                        plan.is_completed && styles.stepNumTextDone,
                      ]}
                    >
                      {plan.is_completed ? "✓" : idx + 1}
                    </Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text
                      style={[
                        styles.planName,
                        plan.is_completed && styles.planNameDone,
                      ]}
                    >
                      {plan.topic}
                    </Text>
                    <Text style={styles.planTime}>
                      ⏱ {plan.estimated_time} min
                    </Text>
                  </View>
                  {plan.is_completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>Done</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
  headerGradient: {
    padding: AppSpacing.lg,
    paddingTop: 60,
    paddingBottom: AppSpacing.xl,
    gap: 6,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 20,
  },
  loadingWrap: {
    alignItems: "center",
    padding: AppSpacing.xl,
    gap: 12,
  },
  loadingText: { color: AppColors.textSecondary, fontSize: 14 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: AppSpacing.lg,
    marginTop: -20,
  },
  statCard: {
    width: "47%",
  },
  statInner: {
    alignItems: "center",
    padding: 16,
    gap: 4,
  },
  statEmoji: { fontSize: 28 },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },
  overallCard: {
    marginHorizontal: AppSpacing.lg,
    gap: 10,
  },
  section: {
    paddingHorizontal: AppSpacing.lg,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
  },
  topicCard: { gap: 10 },
  topicHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  topicMeta: { flex: 1, gap: 2 },
  topicName: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
    paddingRight: 8,
  },
  topicAttempt: { fontSize: 11, color: AppColors.textMuted },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  scoreBadgePass: { backgroundColor: "#E6F9EE" },
  scoreBadgeFail: { backgroundColor: "#FFF0F0" },
  scoreText: { fontSize: 13, fontWeight: "800" },
  scoreTextPass: { color: AppColors.success },
  scoreTextFail: { color: AppColors.danger },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotPass: { backgroundColor: AppColors.success },
  statusDotFail: { backgroundColor: AppColors.danger },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusTextPass: { color: AppColors.success },
  statusTextFail: { color: AppColors.danger },
  emptyCard: { alignItems: "center", gap: 8, paddingVertical: AppSpacing.xl },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
  },
  emptySub: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: Radius.md,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumDone: { backgroundColor: AppColors.success },
  stepNumText: { fontSize: 12, fontWeight: "700", color: AppColors.primary },
  stepNumTextDone: { color: "#fff" },
  planInfo: { flex: 1 },
  planName: { fontSize: 13, fontWeight: "600", color: AppColors.text },
  planNameDone: {
    color: AppColors.textMuted,
    textDecorationLine: "line-through",
  },
  planTime: { fontSize: 11, color: AppColors.textMuted, marginTop: 2 },
  completedBadge: {
    backgroundColor: "#E6F9EE",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  completedBadgeText: {
    color: AppColors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  pendingBadge: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pendingBadgeText: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
});
