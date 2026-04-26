import { BackButton } from "@/components/ui/back-button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useColors } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LEVELS = [
  { id: "beginner", label: "Beginner", emoji: "🌱", desc: "I have no programming experience" },
  { id: "basic", label: "Basic", emoji: "🚀", desc: "I know a little but want to improve" },
];
const STUDY_TIMES = [
  { minutes: 10, label: "10 min / day" },
  { minutes: 15, label: "15 min / day" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const updateUserProgress = useMutation(api.users.updateUserProgress);

  const handleStart = async () => {
    if (!selectedLevel) { Alert.alert("Select Level", "Please choose your experience level to continue."); return; }
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("edumentor_user_id");
      if (userId) {
        await updateUserProgress({ userId: userId as Id<"users">, status: "learning", current_step: 1, current_topic: "" });
      }
      await AsyncStorage.setItem("edumentor_level", selectedLevel);
      await AsyncStorage.setItem("edumentor_study_time", String(selectedTime));
      router.replace("/ai-planning");
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <BackButton label="Back" onPress={() => router.replace("/register")} />
      <View style={styles.header}>
        <Text style={styles.wave}>🎯</Text>
        <Text style={styles.title}>Let's Start Your{"\n"}Learning Journey</Text>
        <Text style={styles.subtitle}>Tell us about yourself so we can create the perfect Python learning plan for you.</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Experience Level</Text>
        <View style={styles.levelGrid}>
          {LEVELS.map((lvl) => {
            const isActive = selectedLevel === lvl.id;
            return (
              <TouchableOpacity key={lvl.id} style={[styles.levelCard, isActive && styles.levelCardActive]}
                onPress={() => setSelectedLevel(lvl.id)} activeOpacity={0.8}>
                <Text style={styles.levelEmoji}>{lvl.emoji}</Text>
                <Text style={[styles.levelLabel, isActive && styles.levelLabelActive]}>{lvl.label}</Text>
                <Text style={[styles.levelDesc, isActive && styles.levelDescActive]}>{lvl.desc}</Text>
                {isActive && (<View style={styles.checkBadge}><Text style={styles.checkMark}>✓</Text></View>)}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Study Time</Text>
        <View style={styles.timeRow}>
          {STUDY_TIMES.map((t) => {
            const isActive = selectedTime === t.minutes;
            return (
              <TouchableOpacity key={t.minutes} style={[styles.timeChip, isActive && styles.timeChipActive]}
                onPress={() => setSelectedTime(t.minutes)} activeOpacity={0.8}>
                <Text style={[styles.timeLabel, isActive && styles.timeLabelActive]}>⏱ {t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.featCard}>
        <Text style={styles.featTitle}>Your AI Plan Includes</Text>
        {["📋 Personalized step-by-step topics", "💡 AI-generated explanations & code", "🧩 Adaptive quizzes per topic", "📈 Continuous progress tracking"].map((f, i) => (
          <Text key={i} style={styles.featItem}>{f}</Text>
        ))}
      </View>
      <GradientButton label="Start Learning →" onPress={handleStart} loading={loading} />
      <View style={{ height: AppSpacing.xl }} />
    </ScrollView>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { padding: AppSpacing.lg, gap: AppSpacing.lg, paddingTop: 60 },
    header: { alignItems: "center", gap: 12, paddingVertical: AppSpacing.sm },
    wave: { fontSize: 48 },
    title: { fontSize: 26, fontWeight: "800", color: c.text, textAlign: "center", letterSpacing: -0.5, lineHeight: 34 },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },
    section: { gap: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    levelGrid: { flexDirection: "row", gap: 12 },
    levelCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.lg, padding: AppSpacing.md,
      alignItems: "center", borderWidth: 2, borderColor: c.border, gap: 6, position: "relative",
    },
    levelCardActive: { borderColor: c.primary, backgroundColor: c.primaryLight },
    levelEmoji: { fontSize: 32 },
    levelLabel: { fontSize: 15, fontWeight: "700", color: c.text },
    levelLabelActive: { color: c.primary },
    levelDesc: { fontSize: 11, color: c.textMuted, textAlign: "center", lineHeight: 16 },
    levelDescActive: { color: c.primaryDark },
    checkBadge: {
      position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
      backgroundColor: c.primary, alignItems: "center", justifyContent: "center",
    },
    checkMark: { color: "#fff", fontSize: 11, fontWeight: "700" },
    timeRow: { flexDirection: "row", gap: 12 },
    timeChip: {
      flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 2,
      borderColor: c.border, alignItems: "center", backgroundColor: c.surface,
    },
    timeChipActive: { borderColor: c.accent, backgroundColor: c.accentLight },
    timeLabel: { fontSize: 14, fontWeight: "600", color: c.textSecondary },
    timeLabelActive: { color: c.accent },
    featCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg, padding: AppSpacing.md,
      gap: 10, borderLeftWidth: 4, borderLeftColor: c.primary,
    },
    featTitle: { fontSize: 14, fontWeight: "700", color: c.text, marginBottom: 2 },
    featItem: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
