import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useColors } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ProgressScreen() {
  const router = useRouter();
  const colors = useColors();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("edumentor_user_id").then((id) => {
      if (id) setUserId(id as Id<"users">);
      else router.replace("/login");
    });
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const allPlans = useQuery(api.learningPlans.getAllUserPlans, userId ? { userId } : "skip");
  const progressList = useQuery(api.progress.getUserProgress, userId ? { userId } : "skip");

  const completed = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const total = allPlans?.length ?? 0;
  const progressRatio = total > 0 ? completed / total : 0;

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user || !allPlans || !progressList) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>📊 Your Progress</Text>
        <Text style={styles.headerSub}>
          {completed} of {total} topics completed
        </Text>
        <View style={styles.headerProgressTrack}>
          <View style={[styles.headerProgressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
        </View>
      </LinearGradient>

      {/* Overview Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Completed", value: completed, emoji: "✅" },
          { label: "Remaining", value: total - completed, emoji: "📋" },
          { label: "Passed", value: progressList.filter((p) => p.is_passed).length, emoji: "🎯" },
        ].map((s, i, arr) => (
          <View key={s.label} style={[styles.statItem, i < arr.length - 1 && styles.statBorder]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statNum}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Overall progress card */}
      <Card style={styles.progressCard}>
        <Text style={styles.cardTitle}>Overall Completion</Text>
        <ProgressBar progress={progressRatio} showPercent label="Topics" />
      </Card>

      {/* Topic list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Topics</Text>
        {allPlans.map((plan, idx) => {
          const result = progressList.find((p) => p.topic === plan.topic);
          return (
            <View key={plan._id} style={styles.topicRow}>
              <View style={[styles.topicNum, plan.is_completed && styles.topicNumDone]}>
                <Text style={[styles.topicNumText, plan.is_completed && styles.topicNumTextDone]}>
                  {plan.is_completed ? "✓" : idx + 1}
                </Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={[styles.topicName, plan.is_completed && styles.topicNameDone]}>
                  {plan.topic}
                </Text>
                <Text style={styles.topicMeta}>
                  {plan.estimated_time} min
                  {result ? ` • Score: ${result.score}%` : ""}
                </Text>
              </View>
              {result && (
                <View style={[styles.scoreBadge, result.is_passed ? styles.scorePassed : styles.scoreFailed]}>
                  <Text style={[styles.scoreText, result.is_passed ? styles.scorePassedText : styles.scoreFailedText]}>
                    {result.is_passed ? "Pass" : "Fail"}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    headerGradient: {
      padding: AppSpacing.lg, paddingTop: 60, paddingBottom: AppSpacing.xl, gap: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
    headerProgressTrack: {
      height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden",
    },
    headerProgressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
    statsRow: {
      flexDirection: "row", marginHorizontal: AppSpacing.lg,
      backgroundColor: c.surface, borderRadius: Radius.lg, paddingVertical: 16,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statBorder: { borderRightWidth: 1, borderRightColor: c.border },
    statEmoji: { fontSize: 20 },
    statNum: { fontSize: 20, fontWeight: "800", color: c.primary },
    statLabel: { fontSize: 10, color: c.textMuted, fontWeight: "500" },
    progressCard: { marginHorizontal: AppSpacing.lg },
    cardTitle: { fontSize: 15, fontWeight: "700", color: c.text, marginBottom: 8 },
    section: { paddingHorizontal: AppSpacing.lg, gap: 10 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: c.text, marginBottom: 4 },
    topicRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: c.surface, borderRadius: Radius.md, padding: 12,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    topicNum: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: c.primaryLight, alignItems: "center", justifyContent: "center",
    },
    topicNumDone: { backgroundColor: c.success },
    topicNumText: { fontSize: 13, fontWeight: "700", color: c.primary },
    topicNumTextDone: { color: "#fff" },
    topicInfo: { flex: 1 },
    topicName: { fontSize: 14, fontWeight: "600", color: c.text },
    topicNameDone: { color: c.textMuted, textDecorationLine: "line-through" },
    topicMeta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    scoreBadge: { borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 8 },
    scorePassed: { backgroundColor: c.success + "20" },
    scoreFailed: { backgroundColor: c.danger + "20" },
    scoreText: { fontSize: 11, fontWeight: "700" },
    scorePassedText: { color: c.success },
    scoreFailedText: { color: c.danger },
  });
}
