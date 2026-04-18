import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { GradientButton } from "@/components/ui/gradient-button";
import { BackButton } from "@/components/ui/back-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const registerUser = useMutation(api.users.registerUser);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        level: "beginner", // will be set on onboarding
      });
      
      Alert.alert(
        "Account Created!", 
        "Your account has been created successfully. Please login to continue.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    } catch (err: unknown) {
      let msg = "Registration failed";
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <BackButton label="Back to Login" onPress={() => router.replace("/login")} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>✏️</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join EduMentor AI and start your Python learning journey
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor={AppColors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={AppColors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor={AppColors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <GradientButton
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />
        </View>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  container: {
    flexGrow: 1,
    padding: AppSpacing.lg,
    gap: AppSpacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: { fontSize: 32 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: AppSpacing.md,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: Radius.xl,
    padding: AppSpacing.lg,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    gap: AppSpacing.md,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textSecondary,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: AppColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: AppColors.text,
    backgroundColor: AppColors.background,
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 13,
  },
  eyeText: { fontSize: 18 },
  btn: { marginTop: 4 },
  linkText: {
    textAlign: "center",
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    color: AppColors.primary,
    fontWeight: "700",
  },
});
