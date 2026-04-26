import { AskAIModal } from "@/components/ui/ask-ai-modal";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { useColors } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const colors = useColors();

  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [level, setLevel] = useState("beginner");
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("material");
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [sessionId, setSessionId] = useState<Id<"learning_sessions"> | null>(null);

  const generateLesson = useAction(api.ai.generateLesson);
  const startSession = useMutation(api.learningSessions.startSession);
  const endSession = useMutation(api.learningSessions.endSession);
  const saveQuiz = useMutation(api.progress.saveQuizResult);
  const markComplete = useMutation(api.learningPlans.markTopicComplete);
  const updateUser = useMutation(api.users.updateUserProgress);
  const updateStreak = useMutation(api.users.updateStreak);

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

  useEffect(() => {
    if (!todayTopic || !userId || material) return;
    loadLesson(todayTopic.topic);
    startSession({ userId, topic: todayTopic.topic }).then((sid) =>
      setSessionId(sid)
    );
  }, [todayTopic, userId]);

  // Single API call loads BOTH material and quiz
  const loadLesson = async (topic: string) => {
    setLoadingMaterial(true);
    try {
      const lesson = await generateLesson({ topic, level });
      setMaterial(lesson.material);
      setQuizQuestions(lesson.questions);
    } catch (err: any) {
      const msg = err?.data || "Could not load lesson. Try again.";
      Alert.alert("AI Error", msg);
    } finally {
      setLoadingMaterial(false);
    }
  };

  const startQuiz = () => {
    setPhase("quiz");
    setSelected(null);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setShowExplanation(false);
    // Quiz questions already loaded — no extra API call needed!
    if (quizQuestions.length === 0 && todayTopic) {
      // Fallback: reload lesson if somehow quiz is empty
      setLoadingQuiz(true);
      generateLesson({ topic: todayTopic.topic, level })
        .then((lesson) => {
          setQuizQuestions(lesson.questions);
        })
        .catch(() => {
          Alert.alert("Error", "Could not load quiz.");
          setPhase("material");
        })
        .finally(() => setLoadingQuiz(false));
    }
  };

  const currentQuiz = quizQuestions[currentQuestionIndex] ?? null;
  const totalQuestions = quizQuestions.length;

  const handleSubmit = async () => {
    if (selected === null || !currentQuiz || !userId || !todayTopic) return;
    const isCorrect = selected === currentQuiz.correct_index;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (!userId || !todayTopic) return;
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < totalQuestions) {
      // Move to next question
      setCurrentQuestionIndex(nextIndex);
      setSelected(null);
      setShowExplanation(false);
    } else {
      // Quiz finished — calculate final score
      const finalCorrect = correctCount + (selected === currentQuiz!.correct_index ? 1 : 0);
      // Re-count since handleSubmit might not have run for the last Q
      const finalScore = Math.round((finalCorrect / totalQuestions) * 100);
      const isPassed = finalScore >= 60;

      await saveQuiz({ userId, topic: todayTopic.topic, score: finalScore, is_passed: isPassed });
      if (sessionId) await endSession({ sessionId, score: finalScore, completed: isPassed });
      if (isPassed) await updateStreak({ userId });
      setPhase("result");
    }
  };

  const handleNextTopic = async () => {
    if (!todayTopic || !userId) return;
    await markComplete({ planId: todayTopic._id });
    setPhase("material");
    setMaterial(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setSelected(null);
    setShowExplanation(false);
    setSessionId(null);
  };

  const topic = todayTopic?.topic ?? "Python";
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (todayTopic === undefined || !userId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your lesson...</Text>
      </View>
    );
  }

  if (todayTopic === null) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 60 }}>🏆</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 10 }}>All Caught Up!</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", paddingHorizontal: 30, marginTop: 8 }}>
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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={styles.backBtn}>
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
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Generating lesson...</Text>
              </View>
            ) : material ? (
              <>
                <Card style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>💡</Text>
                    <Text style={styles.sectionTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{material.explanation}</Text>
                </Card>

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

                <GradientButton label="Take the Quiz →" onPress={startQuiz} style={styles.quizBtn} />
              </>
            ) : null}
          </>
        )}

        {/* QUIZ PHASE */}
        {phase === "quiz" && (
          <>
            {loadingQuiz ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Generating quiz ({totalQuestions > 0 ? `${totalQuestions} questions` : '...'})...</Text>
              </View>
            ) : currentQuiz ? (
              <>
                {/* Progress indicator */}
                <View style={styles.quizProgressRow}>
                  <Text style={styles.quizProgressText}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </Text>
                  <View style={styles.quizProgressBar}>
                    <View style={[styles.quizProgressFill, { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }]} />
                  </View>
                </View>

                <Card style={styles.section}>
                  <View style={styles.quizHeaderRow}>
                    <Text style={styles.quizTag}>Quiz</Text>
                    <Text style={styles.quizTopic}>{topic}</Text>
                  </View>
                  <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
                </Card>

                <View style={styles.choicesWrap}>
                  {currentQuiz.choices.map((choice, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = showExplanation && idx === currentQuiz.correct_index;
                    const isWrong = showExplanation && isSelected && idx !== currentQuiz.correct_index;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.choiceCard,
                          isSelected && !showExplanation && styles.choiceSelected,
                          isCorrect && { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
                          isWrong && { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
                        ]}
                        onPress={() => !showExplanation && setSelected(idx)}
                        activeOpacity={showExplanation ? 1 : 0.8}
                        disabled={showExplanation}
                      >
                        <View style={[
                          styles.choiceLetter,
                          isSelected && !showExplanation && styles.choiceLetterActive,
                          isCorrect && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
                          isWrong && { backgroundColor: '#ef4444', borderColor: '#ef4444' },
                        ]}>
                          <Text style={[
                            styles.choiceLetterText,
                            (isSelected || isCorrect || isWrong) && styles.choiceLetterTextActive,
                          ]}>
                            {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.choiceText,
                          isSelected && !showExplanation && styles.choiceTextActive,
                          isCorrect && { color: '#16a34a', fontWeight: '600' as const },
                          isWrong && { color: '#dc2626' },
                        ]}>
                          {choice}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Show explanation after submitting */}
                {showExplanation && (
                  <Card style={styles.section}>
                    <Text style={styles.explanationLabel}>📝 Explanation</Text>
                    <Text style={styles.explanationText}>{currentQuiz.explanation}</Text>
                  </Card>
                )}

                {!showExplanation ? (
                  <GradientButton
                    label="Submit Answer"
                    onPress={handleSubmit}
                    disabled={selected === null}
                    style={styles.quizBtn}
                  />
                ) : (
                  <GradientButton
                    label={currentQuestionIndex + 1 < totalQuestions ? `Next Question →` : `See Results →`}
                    onPress={handleNextQuestion}
                    style={styles.quizBtn}
                  />
                )}
              </>
            ) : null}
          </>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && (
          <>
            {(() => {
              const finalCorrect = correctCount;
              const finalScore = Math.round((finalCorrect / totalQuestions) * 100);
              const isPassed = finalScore >= 60;
              return (
                <>
                  <View style={styles.resultBanner}>
                    {isPassed ? (
                      <>
                        <Text style={styles.resultEmoji}>🎉</Text>
                        <Text style={styles.resultTitle}>Great Job!</Text>
                        <Text style={styles.resultScore}>
                          {finalCorrect} / {totalQuestions} Correct ({finalScore}%)
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.resultEmoji}>💪</Text>
                        <Text style={styles.resultTitle}>Keep Practicing!</Text>
                        <Text style={styles.resultScore}>
                          {finalCorrect} / {totalQuestions} Correct ({finalScore}%)
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                          You need at least 60% to pass. Review the material and try again!
                        </Text>
                      </>
                    )}
                  </View>

                  {isPassed ? (
                    <GradientButton label="Next Topic →" onPress={handleNextTopic} style={styles.quizBtn} />
                  ) : (
                    <GradientButton label="Retry Quiz" onPress={startQuiz} style={styles.quizBtn} />
                  )}
                  <GradientButton
                    label="Back to Home"
                    onPress={() => router.push("/(tabs)/home")}
                    variant="outline"
                    style={styles.quizBtn}
                  />
                </>
              );
            })()}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {phase === "material" && material && (
        <TouchableOpacity style={styles.fabBtn} onPress={() => setAiModalVisible(true)} activeOpacity={0.9}>
          <Text style={styles.fabText}>✦ Ask AI</Text>
        </TouchableOpacity>
      )}

      <AskAIModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} topic={topic} />
    </View>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { padding: AppSpacing.lg, paddingTop: 60, gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background, gap: 12 },
    loadingText: { color: c.textSecondary, fontSize: 14 },
    topBar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    backArrow: { fontSize: 18, color: c.primary, lineHeight: 20 },
    topMid: { flex: 1 },
    topLabel: { fontSize: 11, color: c.textMuted, fontWeight: "600", letterSpacing: 1 },
    topTopic: { fontSize: 15, fontWeight: "700", color: c.text },
    phaseBadge: { backgroundColor: c.primaryLight, borderRadius: Radius.full, paddingVertical: 5, paddingHorizontal: 10 },
    phaseText: { fontSize: 11, fontWeight: "700", color: c.primary },
    loadingCard: { alignItems: "center", justifyContent: "center", padding: AppSpacing.xl, gap: 12 },
    section: { gap: 12 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    explanationText: { fontSize: 14, lineHeight: 22, color: c.textSecondary },
    keyPointRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingLeft: 4 },
    keyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginTop: 8 },
    keyPointText: { flex: 1, fontSize: 13, lineHeight: 20, color: c.textSecondary },
    codeHeader: {
      flexDirection: "row", alignItems: "center", gap: 8, padding: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    codeLangBadge: { marginLeft: "auto", backgroundColor: c.text, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 8 },
    codeLang: { color: c.background, fontSize: 10, fontWeight: "700" },
    codeText: {
      fontFamily: "monospace", fontSize: 13, color: c.text,
      backgroundColor: c.overlay, padding: 16, lineHeight: 22, minWidth: "100%",
    },
    quizBtn: { marginTop: 4 },
    quizProgressRow: { gap: 6, marginBottom: 4 },
    quizProgressText: { fontSize: 13, fontWeight: "600", color: c.textSecondary, textAlign: "center" },
    quizProgressBar: { height: 6, backgroundColor: c.border, borderRadius: 3, overflow: "hidden" },
    quizProgressFill: { height: 6, backgroundColor: c.primary, borderRadius: 3 },
    quizHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    quizTag: {
      backgroundColor: c.primaryLight, color: c.primary, fontSize: 11, fontWeight: "700",
      paddingVertical: 3, paddingHorizontal: 8, borderRadius: Radius.full, letterSpacing: 0.5,
    },
    quizTopic: { fontSize: 13, color: c.textMuted },
    quizQuestion: { fontSize: 17, fontWeight: "700", color: c.text, lineHeight: 26 },
    choicesWrap: { gap: 10 },
    choiceCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: c.surface, borderRadius: Radius.md, padding: 14,
      borderWidth: 2, borderColor: c.border,
    },
    choiceSelected: { borderColor: c.primary, backgroundColor: c.primaryLight },
    choiceLetter: {
      width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: c.border,
      alignItems: "center", justifyContent: "center",
    },
    choiceLetterActive: { backgroundColor: c.primary, borderColor: c.primary },
    choiceLetterText: { fontSize: 13, fontWeight: "700", color: c.textSecondary },
    choiceLetterTextActive: { color: "#fff" },
    choiceText: { flex: 1, fontSize: 14, color: c.text, lineHeight: 20 },
    choiceTextActive: { color: c.primaryDark, fontWeight: "600" },
    resultBanner: {
      backgroundColor: c.primaryLight, borderRadius: Radius.xl, padding: AppSpacing.lg,
      alignItems: "center", gap: 8,
    },
    resultEmoji: { fontSize: 52 },
    resultTitle: { fontSize: 26, fontWeight: "800", color: c.primary },
    resultScore: { fontSize: 16, color: c.primaryDark, fontWeight: "600" },
    explanationLabel: { fontSize: 14, fontWeight: "700", color: c.text },
    correctAnswerRow: {
      flexDirection: "row", flexWrap: "wrap", marginTop: 6, padding: 10,
      backgroundColor: c.accentLight, borderRadius: Radius.sm,
    },
    correctLabel: { fontSize: 13, color: c.textSecondary, fontWeight: "600" },
    correctValue: { fontSize: 13, color: c.accent, fontWeight: "700" },
    fabBtn: {
      position: "absolute", bottom: 100, right: AppSpacing.lg,
      backgroundColor: c.primary, borderRadius: Radius.full,
      paddingVertical: 14, paddingHorizontal: 22,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
    },
    fabText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  });
}
