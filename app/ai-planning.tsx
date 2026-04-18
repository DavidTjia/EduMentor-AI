import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Id } from "@/convex/_generated/dataModel";

const STEPS = [
  "Analyzing your learning profile...",
  "Selecting Python topics for your level...",
  "Generating personalized content...",
  "Building your learning roadmap...",
  "Almost ready!",
];

export default function AIPlanningScreen() {
  const router = useRouter();
  const generatePlan = useAction(api.ai.generateLearningPlan);
  const updateUserProgress = useMutation(api.users.updateUserProgress);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [stepIndex, setStepIndex] = React.useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Cycle through steps
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 900);

    // Generate plan then navigate
    const run = async () => {
      try {
        const userId = await AsyncStorage.getItem("edumentor_user_id");
        const level = (await AsyncStorage.getItem("edumentor_level")) ?? "beginner";

        if (userId) {
          await generatePlan({
            userId: userId as Id<"users">,
            level,
            cycleId: 1,
          });
        }
        clearInterval(interval);
        router.replace("/(tabs)/home");
      } catch (err: unknown) {
        clearInterval(interval);
        let msg = "Failed to generate learning plan.";
        if (err instanceof ConvexError) {
          msg = typeof err.data === "string" ? err.data : JSON.stringify(err.data);
        } else if (err instanceof Error) {
          msg = err.message;
        }
        Alert.alert("AI Error", msg);
        router.replace("/onboarding");
      }
    };

    run();

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Brain animation placeholder */}
        <View style={styles.iconWrap}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <View style={styles.iconRing} />
        </View>

        <Text style={styles.title}>Creating Your{"\n"}Learning Plan</Text>

        {/* Step text */}
        <View style={styles.stepWrap}>
          <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= stepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Feature pills */}
        <View style={styles.pills}>
          {["AI-Powered", "Personalized", "Adaptive"].map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>✦ {p}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: AppSpacing.lg,
    paddingHorizontal: AppSpacing.xl,
  },
  iconWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: AppColors.primaryLight,
    borderStyle: "dashed",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  stepWrap: {
    backgroundColor: AppColors.surface,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 260,
    alignItems: "center",
  },
  stepText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.border,
  },
  dotActive: {
    backgroundColor: AppColors.primary,
    width: 20,
  },
  pills: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pillText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "600",
  },
});
