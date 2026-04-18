import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { AppColors, Radius, AppSpacing } from "@/constants/theme";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AskAIModalProps {
  visible: boolean;
  onClose: () => void;
  topic: string;
}

export function AskAIModal({ visible, onClose, topic }: AskAIModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askTutor = useAction(api.ai.askAITutor);

  const handleSend = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await askTutor({ topic, question: question.trim() });
      setAnswer(response);
    } catch {
      setAnswer("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion("");
    setAnswer("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          {/* Touchable background to dismiss */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
          
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.indicator} />
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>Ask AI Tutor</Text>
                  <Text style={styles.subtitle}>Topic: {topic}</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Answer area */}
            <ScrollView style={styles.answerScroll} showsVerticalScrollIndicator={false}>
              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={AppColors.primary} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
              {!!answer && !loading && (
                <View style={styles.answerBubble}>
                  <Text style={styles.answerLabel}>✦ AI Tutor</Text>
                  <Text style={styles.answerText}>{answer}</Text>
                </View>
              )}
            </ScrollView>

            {/* Input row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything about this topic..."
                placeholderTextColor={AppColors.textMuted}
                value={question}
                onChangeText={setQuestion}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!question.trim() || loading) && styles.sendDisabled,
                ]}
                onPress={handleSend}
                disabled={!question.trim() || loading}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "80%",
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  answerScroll: {
    maxHeight: 200,
    paddingHorizontal: AppSpacing.lg,
    paddingTop: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  answerBubble: {
    backgroundColor: AppColors.overlay,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: AppSpacing.lg,
    paddingTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.text,
    maxHeight: 100,
    backgroundColor: AppColors.background,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    backgroundColor: AppColors.textMuted,
  },
  sendIcon: {
    color: "#fff",
    fontSize: 16,
  },
});
