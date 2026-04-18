import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Id } from "@/convex/_generated/dataModel";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("edumentor_user_id").then((id) => {
      if (id) setUserId(id as Id<"users">);
      else router.replace("/login");
    });
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const todayTopic = useQuery(
    api.learningPlans.getTodayTopic,
    userId ? { userId, cycleId: 1 } : "skip"
  );
  const allPlans = useQuery(
    api.learningPlans.getAllUserPlans,
    userId ? { userId } : "skip"
  );
  const progressList = useQuery(
    api.progress.getUserProgress,
    userId ? { userId } : "skip"
  );

  const completed = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const total = allPlans?.length ?? 0;
  const progressRatio = total > 0 ? completed / total : 0;
  const isNewUser = completed === 0;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.username}>
              {user?.username ?? "Learner"}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                {(user?.level ?? "beginner").toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.avatarEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Overall progress in header */}
        <View style={styles.headerProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressCount}>
              {completed} / {total} topics
            </Text>
          </View>
          <View style={styles.headerProgressTrack}>
            <View
              style={[
                styles.headerProgressFill,
                { width: `${Math.round(progressRatio * 100)}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Today's Plan Card */}
      {todayTopic ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/plan-detail",
              params: {
                planId: todayTopic._id,
                topic: todayTopic.topic,
                description: todayTopic.description,
                estimatedTime: todayTopic.estimated_time,
              },
            })
          }
        >
          <Card style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY'S PLAN</Text>
              </View>
              <Text style={styles.todayArrow}>→</Text>
            </View>
            <Text style={styles.topicTitle}>{todayTopic.topic}</Text>
            <Text style={styles.topicDesc} numberOfLines={2}>
              {todayTopic.description}
            </Text>
            <View style={styles.topicMeta}>
              <Text style={styles.metaItem}>⏱ {todayTopic.estimated_time} min</Text>
              <Text style={styles.metaItem}>🐍 Python</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ) : (
        <Card style={styles.completedCard}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>All topics completed!</Text>
          <Text style={styles.completedSub}>
            Your AI agent is ready to create a new learning cycle.
          </Text>
        </Card>
      )}

      {/* CTA */}
      <GradientButton
        label={isNewUser ? "Start Learning →" : "Continue Learning →"}
        onPress={() =>
          todayTopic
            ? router.push({
                pathname: "/plan-detail",
                params: {
                  planId: todayTopic._id,
                  topic: todayTopic.topic,
                  description: todayTopic.description,
                  estimatedTime: todayTopic.estimated_time,
                },
              })
            : router.push("/ai-planning")
        }
      />

      {/* Progress section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        <Card>
          <ProgressBar
            progress={progressRatio}
            label="Topics completed"
            showPercent
          />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{total - completed}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {progressList?.filter((p) => p.is_passed).length ?? 0}
              </Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Topics preview */}
      {allPlans && allPlans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Plan</Text>
          {allPlans.slice(0, 4).map((plan, idx) => (
            <View key={plan._id} style={styles.topicRow}>
              <View
                style={[
                  styles.topicNumBadge,
                  plan.is_completed && styles.topicNumDone,
                ]}
              >
                <Text
                  style={[
                    styles.topicNum,
                    plan.is_completed && styles.topicNumTextDone,
                  ]}
                >
                  {plan.is_completed ? "✓" : idx + 1}
                </Text>
              </View>
              <View style={styles.topicRowInfo}>
                <Text
                  style={[
                    styles.topicRowName,
                    plan.is_completed && styles.topicRowDone,
                  ]}
                >
                  {plan.topic}
                </Text>
                <Text style={styles.topicRowTime}>{plan.estimated_time} min</Text>
              </View>
            </View>
          ))}
          {allPlans.length > 4 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
              <Text style={styles.moreTopics}>
                +{allPlans.length - 4} more topics →
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    gap: AppSpacing.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },
  username: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  levelText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 22 },
  headerProgress: { gap: 8 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  progressCount: { color: "#fff", fontSize: 13, fontWeight: "700" },
  headerProgressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  headerProgressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  todayCard: {
    marginHorizontal: AppSpacing.lg,
    marginTop: -20,
    gap: 10,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayBadge: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  todayBadgeText: {
    color: AppColors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  todayArrow: { color: AppColors.primary, fontSize: 18, fontWeight: "700" },
  topicTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
    lineHeight: 24,
  },
  topicDesc: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  topicMeta: { flexDirection: "row", gap: 12 },
  metaItem: { fontSize: 12, color: AppColors.textMuted, fontWeight: "500" },
  completedCard: {
    marginHorizontal: AppSpacing.lg,
    marginTop: -20,
    alignItems: "center",
    gap: 8,
  },
  completedEmoji: { fontSize: 40 },
  completedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  completedSub: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  section: { paddingHorizontal: AppSpacing.lg, gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
  },
  seeAll: { fontSize: 13, color: AppColors.primary, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 22, fontWeight: "800", color: AppColors.primary },
  statLabel: { fontSize: 11, color: AppColors.textMuted, fontWeight: "500" },
  statDivider: { width: 1, backgroundColor: AppColors.border },
  topicRow: {
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
  topicNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  topicNumDone: { backgroundColor: AppColors.success },
  topicNum: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
  },
  topicNumTextDone: { color: "#fff" },
  topicRowInfo: { flex: 1 },
  topicRowName: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.text,
  },
  topicRowDone: {
    color: AppColors.textMuted,
    textDecorationLine: "line-through",
  },
  topicRowTime: {
    fontSize: 11,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  moreTopics: {
    textAlign: "center",
    color: AppColors.primary,
    fontWeight: "600",
    fontSize: 13,
    paddingVertical: 8,
  },
});
