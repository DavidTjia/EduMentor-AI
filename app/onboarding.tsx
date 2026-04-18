import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GradientButton } from "@/components/ui/gradient-button";
import { BackButton } from "@/components/ui/back-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Id } from "@/convex/_generated/dataModel";

const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    emoji: "🌱",
    desc: "I have no programming experience",
  },
  {
    id: "basic",
    label: "Basic",
    emoji: "🚀",
    desc: "I know a little but want to improve",
  },
];

const STUDY_TIMES = [
  { minutes: 10, label: "10 min / day" },
  { minutes: 15, label: "15 min / day" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const updateUserProgress = useMutation(api.users.updateUserProgress);

  const handleStart = async () => {
    if (!selectedLevel) {
      Alert.alert("Select Level", "Please choose your experience level to continue.");
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("edumentor_user_id");
      if (userId) {
        await updateUserProgress({
          userId: userId as Id<"users">,
          status: "learning",
          current_step: 1,
          current_topic: "",
        });
      }
      // Store onboarding data
      await AsyncStorage.setItem("edumentor_level", selectedLevel);
      await AsyncStorage.setItem("edumentor_study_time", String(selectedTime));

      router.replace("/ai-planning");
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BackButton label="Back" onPress={() => router.replace("/register")} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wave}>🎯</Text>
        <Text style={styles.title}>Let's Start Your{"\n"}Learning Journey</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself so we can create the perfect Python learning plan for you.
        </Text>
      </View>

      {/* Level Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Experience Level</Text>
        <View style={styles.levelGrid}>
          {LEVELS.map((lvl) => {
            const isActive = selectedLevel === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.levelCard, isActive && styles.levelCardActive]}
                onPress={() => setSelectedLevel(lvl.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.levelEmoji}>{lvl.emoji}</Text>
                <Text style={[styles.levelLabel, isActive && styles.levelLabelActive]}>
                  {lvl.label}
                </Text>
                <Text style={[styles.levelDesc, isActive && styles.levelDescActive]}>
                  {lvl.desc}
                </Text>
                {isActive && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Study Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Study Time</Text>
        <View style={styles.timeRow}>
          {STUDY_TIMES.map((t) => {
            const isActive = selectedTime === t.minutes;
            return (
              <TouchableOpacity
                key={t.minutes}
                style={[styles.timeChip, isActive && styles.timeChipActive]}
                onPress={() => setSelectedTime(t.minutes)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeLabel, isActive && styles.timeLabelActive]}>
                  ⏱ {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* What you'll get */}
      <View style={styles.featCard}>
        <Text style={styles.featTitle}>Your AI Plan Includes</Text>
        {[
          "📋 Personalized step-by-step topics",
          "💡 AI-generated explanations & code",
          "🧩 Adaptive quizzes per topic",
          "📈 Continuous progress tracking",
        ].map((f, i) => (
          <Text key={i} style={styles.featItem}>{f}</Text>
        ))}
      </View>

      <GradientButton
        label="Start Learning →"
        onPress={handleStart}
        loading={loading}
      />

      <View style={{ height: AppSpacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: {
    padding: AppSpacing.lg,
    gap: AppSpacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    gap: 12,
    paddingVertical: AppSpacing.sm,
  },
  wave: { fontSize: 48 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: AppColors.text,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
  },
  levelGrid: {
    flexDirection: "row",
    gap: 12,
  },
  levelCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: Radius.lg,
    padding: AppSpacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColors.border,
    gap: 6,
    position: "relative",
  },
  levelCardActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryLight,
  },
  levelEmoji: { fontSize: 32 },
  levelLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.text,
  },
  levelLabelActive: { color: AppColors.primary },
  levelDesc: {
    fontSize: 11,
    color: AppColors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
  levelDescActive: { color: AppColors.primaryDark },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#fff", fontSize: 11, fontWeight: "700" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: "center",
    backgroundColor: AppColors.surface,
  },
  timeChipActive: {
    borderColor: AppColors.accent,
    backgroundColor: AppColors.accentLight,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  timeLabelActive: { color: AppColors.accent },
  featCard: {
    backgroundColor: AppColors.surface,
    borderRadius: Radius.lg,
    padding: AppSpacing.md,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  featTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 2,
  },
  featItem: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
