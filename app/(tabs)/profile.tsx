import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { useColors, useTheme } from "@/constants/ThemeContext";
import { AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TELEGRAM_BOT_USERNAME = "Elvyd_bot";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();

  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("edumentor_user_id").then((id) => {
      if (id) setUserId(id as Id<"users">);
      else router.replace("/login");
    });
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    user?.profile_image ? { storageId: user.profile_image } : "skip"
  );
  const allPlans = useQuery(
    api.learningPlans.getAllUserPlans,
    userId ? { userId } : "skip"
  );

  const updateTelegram = useMutation(api.users.updateTelegramSettings);
  const generateToken = useMutation(api.users.generateSyncToken);
  const resetProgress = useMutation(api.users.resetUserProgress);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "edumentor_user_id",
            "edumentor_level",
            "edumentor_study_time",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleResetProgress = () => {
    if (!userId) return;
    Alert.alert(
      "Reset Progress",
      "This will reset all your learning progress. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetProgress({ userId });
            Alert.alert("Done", "Your progress has been reset.");
          },
        },
      ]
    );
  };

  const handleToggleTelegram = async (value: boolean) => {
    if (!userId) return;
    if (value) {
      // Enable: generate token and prompt to connect
      const token = await generateToken({ userId });
      await updateTelegram({ userId, telegram_enabled: true });
      Alert.alert(
        "Connect Telegram",
        `Your sync token is:\n\n${token}\n\nOpen Telegram and send:\n/start ${token}\nto @${TELEGRAM_BOT_USERNAME}`,
        [
          {
            text: "Open Telegram",
            onPress: () =>
              Linking.openURL(
                `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`
              ),
          },
          { text: "OK" },
        ]
      );
    } else {
      handleDisconnectTelegram();
    }
  };

  const handleConnectTelegram = async () => {
    if (!userId) return;
    const token = await generateToken({ userId });
    Alert.alert(
      "New Sync Token",
      `Your new token is:\n\n${token}\n\nSend /start ${token} to @${TELEGRAM_BOT_USERNAME}`,
      [
        {
          text: "Open Telegram",
          onPress: () =>
            Linking.openURL(
              `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`
            ),
        },
        { text: "OK" },
      ]
    );
  };

  const handleDisconnectTelegram = () => {
    if (!userId) return;
    Alert.alert(
      "Disconnect Telegram",
      "You will stop receiving daily learning plans via Telegram.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await updateTelegram({
              userId,
              telegram_enabled: false,
              telegram_chat_id: undefined,
            });
          },
        },
      ]
    );
  };

  const completedCount = allPlans?.filter((p) => p.is_completed).length ?? 0;
  const totalCount = allPlans?.length ?? 0;

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
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
        colors={[colors.primary, "#8B80FF"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => router.push("/edit-profile")}
          activeOpacity={0.8}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl as string }}
              style={styles.avatarImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.levelPill}>
          <Text style={styles.levelPillText}>
            {user.level.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedCount}</Text>
          <Text style={styles.statSub}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalCount}</Text>
          <Text style={styles.statSub}>Total Topics</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user.current_step}</Text>
          <Text style={styles.statSub}>Current Step</Text>
        </View>
      </View>

      {/* Dark Mode Toggle */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>🌙 Dark Mode</Text>
            <Text style={styles.settingDesc}>
              {isDark ? "Dark theme active" : "Switch to dark theme"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* Telegram */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>📱 Telegram Coach</Text>
            <Text style={styles.settingDesc}>
              {user.telegram_enabled
                ? user.telegram_chat_id
                  ? "Connected & active"
                  : "Enabled — waiting for connection"
                : "Get daily reminders via Telegram"}
            </Text>
          </View>
          <Switch
            value={!!user.telegram_enabled}
            onValueChange={handleToggleTelegram}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        {user.telegram_enabled && !user.telegram_chat_id && (
          <GradientButton
            label="Re-generate Token"
            onPress={handleConnectTelegram}
            variant="secondary"
            style={{ marginTop: 10 }}
          />
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <GradientButton
          label="📊 View Cycle Results"
          onPress={() => router.push("/cycle-result")}
          variant="secondary"
        />
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetProgress}>
          <Text style={styles.dangerText}>🔄 Reset Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function createStyles(c: typeof import("@/constants/theme").AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { gap: AppSpacing.md, paddingBottom: AppSpacing.xl },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    header: {
      alignItems: "center", paddingTop: 60, paddingBottom: AppSpacing.xl, gap: 6,
    },
    avatarWrap: { position: "relative", marginBottom: 8 },
    avatarImg: {
      width: 88, height: 88, borderRadius: 44,
      borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    },
    avatarFallback: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center", justifyContent: "center",
      borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    },
    avatarText: { fontSize: 38, fontWeight: "800", color: "#fff" },
    editBadge: {
      position: "absolute", bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: c.primary, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    },
    editIcon: { fontSize: 12 },
    name: { fontSize: 22, fontWeight: "800", color: "#fff" },
    email: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
    levelPill: {
      backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.full,
      paddingVertical: 4, paddingHorizontal: 12, marginTop: 4,
    },
    levelPillText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
    statsRow: {
      flexDirection: "row", marginHorizontal: AppSpacing.lg,
      backgroundColor: c.surface, borderRadius: Radius.lg, paddingVertical: 16,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    },
    statBox: { flex: 1, alignItems: "center", gap: 4 },
    statNum: { fontSize: 20, fontWeight: "800", color: c.primary },
    statSub: { fontSize: 10, color: c.textMuted, fontWeight: "500" },
    statDivider: { width: 1, backgroundColor: c.border },
    settingCard: { marginHorizontal: AppSpacing.lg },
    settingRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    settingInfo: { flex: 1, marginRight: 12 },
    settingLabel: { fontSize: 15, fontWeight: "700", color: c.text },
    settingDesc: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    actions: { paddingHorizontal: AppSpacing.lg, gap: 12 },
    dangerBtn: {
      borderWidth: 2, borderColor: c.danger, borderRadius: Radius.lg,
      paddingVertical: 14, alignItems: "center",
    },
    dangerText: { color: c.danger, fontSize: 15, fontWeight: "600" },
    logoutBtn: {
      borderWidth: 2, borderColor: c.border, borderRadius: Radius.lg,
      paddingVertical: 14, alignItems: "center",
    },
    logoutText: { color: c.textSecondary, fontSize: 15, fontWeight: "600" },
  });
}
