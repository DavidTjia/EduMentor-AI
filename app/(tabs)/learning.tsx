import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AskAIModal } from "@/components/ui/ask-ai-modal";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Id } from "@/convex/_generated/dataModel";

type QuizQuestion = {
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
};

type LearningMaterial = {
  explanation: string;
  code_example: string;
  key_points: string[];
};

type Phase = "material" | "quiz" | "result";

export default function LearningScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [level, setLevel] = useState("beginner");
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("material");
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [sessionId, setSessionId] = useState<Id<"learning_sessions"> | null>(null);

  const generateMaterial = useAction(api.ai.generateLearningMaterial);
  const generateQuiz = useAction(api.ai.generateQuizQuestion);
  const startSession = useMutation(api.learningSessions.startSession);
  const endSession = useMutation(api.learningSessions.endSession);
  const saveQuiz = useMutation(api.progress.saveQuizResult);
  const markComplete = useMutation(api.learningPlans.markTopicComplete);
  const updateUser = useMutation(api.users.updateUserProgress);

  const todayTopic = useQuery(
    api.learningPlans.getTodayTopic,
    userId ? { userId, cycleId: 1 } : "skip"
  );

  useEffect(() => {
    const loadAuth = async () => {
      const uid = await AsyncStorage.getItem("edumentor_user_id");
      const lvl = (await AsyncStorage.getItem("edumentor_level")) ?? "beginner";
      if (uid) {
        setUserId(uid as Id<"users">);
        setLevel(lvl);
      } else {
        router.replace("/login");
      }
    };
    loadAuth();
  }, []);

  // Load material when topic is ready
  useEffect(() => {
    if (!todayTopic || !userId || material) return;
    loadMaterial(todayTopic.topic);
    // Start session
    startSession({ userId, topic: todayTopic.topic }).then((sid) =>
      setSessionId(sid)
    );
  }, [todayTopic, userId]);

  const loadMaterial = async (topic: string) => {
    setLoadingMaterial(true);
    try {
      const mat = await generateMaterial({ topic, level });
      setMaterial(mat);
    } catch (err: any) {
      const msg = err?.data || "Could not load learning material. Try again.";
      Alert.alert("AI Error", msg);
    } finally {
      setLoadingMaterial(false);
    }
  };

  const loadQuiz = async () => {
    if (!todayTopic) return;
    setLoadingQuiz(true);
    setPhase("quiz");
    setSelected(null);
    setQuiz(null);
    try {
      const q = await generateQuiz({ topic: todayTopic.topic, level });
      setQuiz(q);
    } catch (err: any) {
      const msg = err?.data || "Could not generate quiz. Try again.";
      Alert.alert("AI Error", msg);
      setPhase("material");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSubmit = async () => {
    if (selected === null || !quiz || !userId || !todayTopic) return;
    const isPassed = selected === quiz.correct_index;
    const score = isPassed ? 100 : 0;

    await saveQuiz({ userId, topic: todayTopic.topic, score, is_passed: isPassed });
    if (sessionId) await endSession({ sessionId, score, completed: isPassed });
    setPhase("result");
  };

  const handleNextTopic = async () => {
    if (!todayTopic || !userId) return;
    await markComplete({ planId: todayTopic._id });
    // Reset local state for next topic
    setPhase("material");
    setMaterial(null);
    setQuiz(null);
    setSelected(null);
    setSessionId(null);
    // reload will pick up the next incomplete topic
  };

  const topic = todayTopic?.topic ?? "Python";

  if (todayTopic === undefined || !userId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading your lesson...</Text>
      </View>
    );
  }

  if (todayTopic === null) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 60 }}>🏆</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: AppColors.primary, marginTop: 10 }}>All Caught Up!</Text>
        <Text style={{ fontSize: 14, color: AppColors.textSecondary, textAlign: "center", paddingHorizontal: 30, marginTop: 8 }}>
          You have successfully completed all the topics in your current learning journey. 
          Check your Progress tab to review your stats!
        </Text>
        <GradientButton
          label="Go to Home"
          onPress={() => router.push("/(tabs)/home")}
          style={{ marginTop: 24, width: "70%" }}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.topMid}>
            <Text style={styles.topLabel}>Learning</Text>
            <Text style={styles.topTopic} numberOfLines={1}>{topic}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              {phase === "material" ? "📖 Study" : phase === "quiz" ? "🧩 Quiz" : "✅ Done"}
            </Text>
          </View>
        </View>

        {/* MATERIAL PHASE */}
        {phase === "material" && (
          <>
            {loadingMaterial ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={AppColors.primary} />
                <Text style={styles.loadingText}>Generating lesson...</Text>
              </View>
            ) : material ? (
              <>
                {/* Explanation */}
                <Card style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>💡</Text>
                    <Text style={styles.sectionTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{material.explanation}</Text>
                </Card>

                {/* Key points */}
                <Card style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>🎯</Text>
                    <Text style={styles.sectionTitle}>Key Points</Text>
                  </View>
                  {material.key_points.map((pt, i) => (
                    <View key={i} style={styles.keyPointRow}>
                      <View style={styles.keyDot} />
                      <Text style={styles.keyPointText}>{pt}</Text>
                    </View>
                  ))}
                </Card>

                {/* Code example */}
                <Card style={styles.section} padded={false}>
                  <View style={styles.codeHeader}>
                    <Text style={styles.sectionIcon}>🐍</Text>
                    <Text style={styles.sectionTitle}>Code Example</Text>
                    <View style={styles.codeLangBadge}>
                      <Text style={styles.codeLang}>Python</Text>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.codeText}>{material.code_example}</Text>
                  </ScrollView>
                </Card>

                <GradientButton
                  label="Take the Quiz →"
                  onPress={loadQuiz}
                  style={styles.quizBtn}
                />
              </>
            ) : null}
          </>
        )}

        {/* QUIZ PHASE */}
        {phase === "quiz" && (
          <>
            {loadingQuiz ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={AppColors.primary} />
                <Text style={styles.loadingText}>Generating quiz...</Text>
              </View>
            ) : quiz ? (
              <>
                <Card style={styles.section}>
                  <View style={styles.quizHeaderRow}>
                    <Text style={styles.quizTag}>Quiz</Text>
                    <Text style={styles.quizTopic}>{topic}</Text>
                  </View>
                  <Text style={styles.quizQuestion}>{quiz.question}</Text>
                </Card>

                <View style={styles.choicesWrap}>
                  {quiz.choices.map((choice, idx) => {
                    const isSelected = selected === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.choiceCard, isSelected && styles.choiceSelected]}
                        onPress={() => setSelected(idx)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.choiceLetter,
                            isSelected && styles.choiceLetterActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceLetterText,
                              isSelected && styles.choiceLetterTextActive,
                            ]}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.choiceText,
                            isSelected && styles.choiceTextActive,
                          ]}
                        >
                          {choice}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <GradientButton
                  label="Submit Answer →"
                  onPress={handleSubmit}
                  disabled={selected === null}
                  style={styles.quizBtn}
                />
              </>
            ) : null}
          </>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && quiz && (
          <>
            <View style={styles.resultBanner}>
              {selected === quiz.correct_index ? (
                <>
                  <Text style={styles.resultEmoji}>🎉</Text>
                  <Text style={styles.resultTitle}>Correct!</Text>
                  <Text style={styles.resultScore}>Score: 100 / 100</Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultEmoji}>💪</Text>
                  <Text style={styles.resultTitle}>Keep Going!</Text>
                  <Text style={styles.resultScore}>Score: 0 / 100</Text>
                </>
              )}
            </View>

            <Card style={styles.section}>
              <Text style={styles.explanationLabel}>📝 Explanation</Text>
              <Text style={styles.explanationText}>{quiz.explanation}</Text>
              <View style={styles.correctAnswerRow}>
                <Text style={styles.correctLabel}>Correct answer: </Text>
                <Text style={styles.correctValue}>
                  {quiz.choices[quiz.correct_index]}
                </Text>
              </View>
            </Card>

            <GradientButton
              label="Next Topic →"
              onPress={handleNextTopic}
              style={styles.quizBtn}
            />
            <GradientButton
              label="Back to Home"
              onPress={() => router.push("/(tabs)/home")}
              variant="outline"
              style={styles.quizBtn}
            />
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Ask AI button */}
      {phase === "material" && material && (
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setAiModalVisible(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.fabText}>✦ Ask AI</Text>
        </TouchableOpacity>
      )}

      <AskAIModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        topic={topic}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: {
    padding: AppSpacing.lg,
    paddingTop: 60,
    gap: AppSpacing.md,
    paddingBottom: AppSpacing.xl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
    gap: 12,
  },
  loadingText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: { fontSize: 18, color: AppColors.primary, lineHeight: 20 },
  topMid: { flex: 1 },
  topLabel: { fontSize: 11, color: AppColors.textMuted, fontWeight: "600", letterSpacing: 1 },
  topTopic: { fontSize: 15, fontWeight: "700", color: AppColors.text },
  phaseBadge: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  phaseText: { fontSize: 11, fontWeight: "700", color: AppColors.primary },
  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: AppSpacing.xl,
    gap: 12,
  },
  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: AppColors.text },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.textSecondary,
  },
  keyPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingLeft: 4,
  },
  keyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginTop: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: AppColors.textSecondary,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  codeLangBadge: {
    marginLeft: "auto",
    backgroundColor: AppColors.text,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  codeLang: { color: "#fff", fontSize: 10, fontWeight: "700" },
  codeText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: AppColors.text,
    backgroundColor: "#F8F9FF",
    padding: 16,
    lineHeight: 22,
    minWidth: "100%",
  },
  quizBtn: { marginTop: 4 },
  quizHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  quizTag: {
    backgroundColor: AppColors.primaryLight,
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    letterSpacing: 0.5,
  },
  quizTopic: { fontSize: 13, color: AppColors.textMuted },
  quizQuestion: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
    lineHeight: 26,
  },
  choicesWrap: { gap: 10 },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  choiceSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryLight,
  },
  choiceLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceLetterActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  choiceLetterText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  choiceLetterTextActive: { color: "#fff" },
  choiceText: { flex: 1, fontSize: 14, color: AppColors.text, lineHeight: 20 },
  choiceTextActive: { color: AppColors.primaryDark, fontWeight: "600" },
  resultBanner: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: Radius.xl,
    padding: AppSpacing.lg,
    alignItems: "center",
    gap: 8,
  },
  resultEmoji: { fontSize: 52 },
  resultTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: AppColors.primary,
  },
  resultScore: {
    fontSize: 16,
    color: AppColors.primaryDark,
    fontWeight: "600",
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
  },
  correctAnswerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    padding: 10,
    backgroundColor: AppColors.accentLight,
    borderRadius: Radius.sm,
  },
  correctLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  correctValue: {
    fontSize: 13,
    color: AppColors.accent,
    fontWeight: "700",
  },
  fabBtn: {
    position: "absolute",
    bottom: 100,
    right: AppSpacing.lg,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
