import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Id } from "@/convex/_generated/dataModel";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("edumentor_user_id").then((id) => {
      if (id) setUserId(id as Id<"users">);
      else router.replace("/login");
    });
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const progressList = useQuery(
    api.progress.getUserProgress,
    userId ? { userId } : "skip"
  );
  const allPlans = useQuery(
    api.learningPlans.getAllUserPlans,
    userId ? { userId } : "skip"
  );

  const resetProgress = useMutation(api.users.resetUserProgress);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("edumentor_user_id");
          await AsyncStorage.removeItem("edumentor_level");
          await AsyncStorage.removeItem("edumentor_study_time");
          router.replace("/login");
        },
      },
    ]);
  };

  const handleResetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "This will clear all your quiz results and learning progress. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            await resetProgress({ userId });
            await AsyncStorage.removeItem("edumentor_level");
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const completedTopics = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const totalTopics = allPlans?.length ?? 0;
  const passedQuizzes = progressList?.filter((p) => p.is_passed).length ?? 0;

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[AppColors.primary, "#8B80FF"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{user.level.toUpperCase()}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {user.status === "learning"
                ? "🟢 Active"
                : user.status === "paused"
                ? "⏸ Paused"
                : "✅ Completed"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Topics Done", value: completedTopics },
          { label: "Total Topics", value: totalTopics },
          { label: "Quizzes Passed", value: passedQuizzes },
        ].map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.statItem,
              i < 2 && styles.statItemBorder,
            ]}
          >
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Account info */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardSectionTitle}>Account Information</Text>
        {[
          { label: "Username", value: user.username, icon: "👤" },
          { label: "Email", value: user.email, icon: "📧" },
          { label: "Level", value: user.level.charAt(0).toUpperCase() + user.level.slice(1), icon: "🎯" },
          { label: "Status", value: user.status.charAt(0).toUpperCase() + user.status.slice(1), icon: "📌" },
          { label: "Current Step", value: `Step ${user.current_step}`, icon: "📍" },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}
          >
            <Text style={styles.infoIcon}>{item.icon}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Learning stats */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardSectionTitle}>Learning Stats</Text>
        {[
          { label: "Current Topic", value: user.current_topic || "Not started yet", icon: "📚" },
          { label: "Topics Completed", value: `${completedTopics} / ${totalTopics}`, icon: "🏅" },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}
          >
            <Text style={styles.infoIcon}>{item.icon}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <GradientButton label="Logout" onPress={handleLogout} variant="outline" />
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetProgress}>
          <Text style={styles.resetBtnText}>🔄 Reset Progress & Restart</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>EduMentor AI v1.0</Text>
        <Text style={styles.appInfoSub}>Powered by Gemini AI ✦</Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: AppColors.background },
  headerGradient: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: AppSpacing.xl,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  username: { fontSize: 24, fontWeight: "800", color: "#fff" },
  email: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  levelRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  levelBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  levelText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
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
  statValue: { fontSize: 22, fontWeight: "800", color: AppColors.primary },
  statLabel: { fontSize: 10, color: AppColors.textMuted, fontWeight: "500", textAlign: "center" },
  infoCard: { marginHorizontal: AppSpacing.lg, gap: 0, overflow: "hidden" },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: AppColors.border },
  infoIcon: { fontSize: 18, width: 24, textAlign: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: AppColors.textMuted, fontWeight: "500", letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: AppColors.text, fontWeight: "600", marginTop: 1 },
  actionsSection: { paddingHorizontal: AppSpacing.lg, gap: 12 },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: AppColors.danger,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetBtnText: { color: AppColors.danger, fontSize: 15, fontWeight: "600" },
  appInfo: { alignItems: "center", gap: 4, paddingVertical: AppSpacing.sm },
  appInfoText: { fontSize: 13, color: AppColors.textMuted, fontWeight: "600" },
  appInfoSub: { fontSize: 11, color: AppColors.textMuted },
});
