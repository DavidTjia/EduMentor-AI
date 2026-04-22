import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const updateTelegram = useMutation(api.users.updateTelegramSettings);
  const generateToken = useMutation(api.users.generateSyncToken);

  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    user?.profile_image ? { storageId: user.profile_image } : "skip"
  );

  const [telegramLoading, setTelegramLoading] = useState(false);

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

  const handleToggleTelegram = async (value: boolean) => {
    if (!userId) return;
    setTelegramLoading(true);
    try {
      if (!value) {
        // Turn off: disable and clear chat_id
        await updateTelegram({
          userId,
          telegram_enabled: false,
          telegram_chat_id: undefined,
          telegram_token: undefined,
          telegram_waiting_reply: false,
        });
      } else {
        // Turn on: just enable, user still needs to connect
        await updateTelegram({ userId, telegram_enabled: true });
      }
    } catch (e) {
      Alert.alert("Error", "Gagal mengubah pengaturan Telegram.");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!userId) return;
    setTelegramLoading(true);
    try {
      const token = await generateToken({ userId });
      const url = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Buka Telegram",
          `Salin kode ini dan kirim ke @${TELEGRAM_BOT_USERNAME}:\n\n/start ${token}`,
          [{ text: "OK" }]
        );
      }
    } catch (e) {
      Alert.alert("Error", "Gagal membuat token sinkronisasi.");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDisconnectTelegram = () => {
    Alert.alert(
      "Putuskan Telegram",
      "Bot tidak akan lagi mengirim notifikasi ke Telegram kamu. Yakin?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Putuskan",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            await updateTelegram({
              userId,
              telegram_enabled: false,
              telegram_chat_id: undefined,
              telegram_token: undefined,
              telegram_waiting_reply: false,
            });
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
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl as string }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
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

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => router.push("/edit-profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
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

      {/* Telegram AI Coach */}
      <Card style={styles.infoCard}>
        <View style={styles.telegramHeader}>
          <View style={styles.telegramTitleRow}>
            <Text style={styles.telegramIcon}>✈️</Text>
            <View>
              <Text style={styles.cardSectionTitle}>AI TELEGRAM COACH</Text>
              <Text style={styles.telegramSubtitle}>Terima jadwal belajar & pengingat via Telegram</Text>
            </View>
          </View>
          <Switch
            value={!!user.telegram_enabled}
            onValueChange={handleToggleTelegram}
            disabled={telegramLoading}
            trackColor={{ false: AppColors.border, true: AppColors.primary }}
            thumbColor="#fff"
          />
        </View>

        {user.telegram_enabled && (
          <View style={styles.telegramBody}>
            {/* Connection Status */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              {user.telegram_chat_id ? (
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>✅ Terhubung</Text>
                </View>
              ) : (
                <View style={styles.disconnectedBadge}>
                  <Text style={styles.disconnectedText}>⚠️ Belum Terhubung</Text>
                </View>
              )}
            </View>

            {/* Bot info */}
            <Text style={styles.botInfo}>
              Bot: <Text style={styles.botName}>@{TELEGRAM_BOT_USERNAME}</Text>
            </Text>

            {/* Action button */}
            {!user.telegram_chat_id ? (
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={handleConnectTelegram}
                disabled={telegramLoading}
              >
                {telegramLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.connectBtnText}>🔗 Sambungkan ke Telegram</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={handleDisconnectTelegram}
              >
                <Text style={styles.disconnectBtnText}>🔌 Putuskan Sambungan</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.telegramHint}>
              💡 Setelah terhubung, kamu akan menerima jadwal belajar setiap jam 08:00 pagi.
              Balas pesan bot untuk reschedule otomatis.
            </Text>
          </View>
        )}
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  editProfileBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  editProfileBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
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

  // Telegram Coach styles
  telegramHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  telegramTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  telegramIcon: { fontSize: 22 },
  telegramSubtitle: { fontSize: 11, color: AppColors.textMuted, marginTop: 1 },
  telegramBody: { marginTop: 14, gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusLabel: { fontSize: 13, color: AppColors.textSecondary, fontWeight: "600" },
  connectedBadge: {
    backgroundColor: "#E6F9EE",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  connectedText: { fontSize: 12, color: AppColors.success, fontWeight: "700" },
  disconnectedBadge: {
    backgroundColor: "#FFF3E0",
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  disconnectedText: { fontSize: 12, color: AppColors.warning, fontWeight: "700" },
  botInfo: { fontSize: 12, color: AppColors.textMuted },
  botName: { color: AppColors.primary, fontWeight: "700" },
  connectBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disconnectBtn: {
    borderWidth: 1.5,
    borderColor: AppColors.textMuted,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  disconnectBtnText: { fontSize: 14, color: AppColors.textMuted, fontWeight: "600" },
  telegramHint: {
    fontSize: 11,
    color: AppColors.textMuted,
    lineHeight: 17,
    fontStyle: "italic",
  },
});
