import { GradientButton } from "@/components/ui/gradient-button";
import { useColors } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const doLogin = useMutation(api.users.loginUser);
  const doRecordLogin = useMutation(api.users.recordAppLogin);

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email/username and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await doLogin({
        emailOrUsername: emailOrUsername.trim().toLowerCase(),
        password
      });

      if (!user) {
        Alert.alert("Login Failed", "Invalid email/username or password.");
        return;
      }

      await AsyncStorage.setItem("edumentor_user_id", user._id);
      try { await doRecordLogin({ userId: user._id }); } catch { /* non-critical */ }

      if (!user.current_topic) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err: unknown) {
      let msg = "An unexpected error occurred.";
      if (err instanceof ConvexError) {
        msg = typeof err.data === "string" ? err.data : JSON.stringify(err.data);
      } else if (err instanceof Error) {
        msg = err.message;
      }
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
          <Text style={styles.appName}>EduMentor AI</Text>
          <Text style={styles.tagline}>Login to continue learning</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email or username"
              placeholderTextColor={colors.textMuted}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <GradientButton label="Login" onPress={handleLogin} loading={loading} style={styles.btn} />
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ Powered by Gemini AI</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, padding: AppSpacing.lg, justifyContent: "center", gap: AppSpacing.lg },
    logoArea: { alignItems: "center", gap: 8, paddingVertical: AppSpacing.md },
    logoCircle: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: c.primaryLight,
      alignItems: "center", justifyContent: "center", marginBottom: 4,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    },
    logoEmoji: { fontSize: 36 },
    appName: { fontSize: 28, fontWeight: "800", color: c.primary, letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: c.textSecondary },
    card: {
      backgroundColor: c.surface, borderRadius: Radius.xl, padding: AppSpacing.lg,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1, shadowRadius: 20, elevation: 6, gap: AppSpacing.md,
    },
    cardTitle: { fontSize: 20, fontWeight: "700", color: c.text, marginBottom: 4 },
    fieldGroup: { gap: 6 },
    label: { fontSize: 13, fontWeight: "600", color: c.textSecondary, marginLeft: 2 },
    input: {
      borderWidth: 1.5, borderColor: c.border, borderRadius: Radius.md,
      paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
      color: c.text, backgroundColor: c.background,
    },
    passwordWrap: { position: "relative" },
    passwordInput: { paddingRight: 48 },
    eyeBtn: { position: "absolute", right: 14, top: 13 },
    eyeText: { fontSize: 18 },
    btn: { marginTop: 4 },
    divider: { flexDirection: "row", alignItems: "center", gap: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { color: c.textMuted, fontSize: 13 },
    linkText: { textAlign: "center", color: c.textSecondary, fontSize: 14 },
    linkBold: { color: c.primary, fontWeight: "700" },
    badge: { alignItems: "center", paddingVertical: AppSpacing.sm },
    badgeText: { color: c.textMuted, fontSize: 12, letterSpacing: 0.5 },
  });
}
