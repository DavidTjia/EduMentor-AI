import { BackButton } from "@/components/ui/back-button";
import { AppColors, AppSpacing, Radius } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function EditProfileScreen() {
    const router = useRouter();

    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);
    const [newStorageId, setNewStorageId] = useState<Id<"_storage"> | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);
    const removeProfileImage = useMutation(api.users.removeProfileImage);

    const [photoRemoved, setPhotoRemoved] = useState(false);

    // Pre-fill fields when user data loads
    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    }, [user]);

    const pickImage = async (source: "camera" | "gallery") => {
        try {
            let result: ImagePicker.ImagePickerResult;

            if (source === "camera") {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Permission Denied", "Camera access is required to take a photo.");
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Permission Denied", "Gallery access is required to pick a photo.");
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                });
            }

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setLocalImageUri(asset.uri);
                await uploadImage(asset.uri);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image. Please try again.");
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            // Get upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Fetch the image as blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Upload to Convex storage
            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });

            const { storageId } = (await uploadResult.json()) as { storageId: Id<"_storage"> };
            setNewStorageId(storageId);
        } catch (error) {
            Alert.alert("Upload Error", "Failed to upload image. Please try again.");
            setLocalImageUri(null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        Alert.alert(
            "Remove Profile Photo",
            "Are you sure you want to remove your profile photo?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        if (!userId) return;
                        try {
                            await removeProfileImage({ userId });
                            setLocalImageUri(null);
                            setNewStorageId(null);
                            setPhotoRemoved(true);
                        } catch (error) {
                            Alert.alert("Error", "Failed to remove profile photo.");
                        }
                    },
                },
            ]
        );
    };

    const showPhotoOptions = () => {
        const hasExistingPhoto = !!(user?.profile_image || localImageUri) && !photoRemoved;
        const options: any[] = [
            { text: "Camera", onPress: () => pickImage("camera") },
            { text: "Gallery", onPress: () => pickImage("gallery") },
        ];
        if (hasExistingPhoto) {
            options.push({
                text: "🗑️ Remove Photo",
                style: "destructive" as const,
                onPress: handleRemovePhoto,
            });
        }
        options.push({ text: "Cancel", style: "cancel" as const });
        Alert.alert("Profile Photo", "Choose an option", options);
    };

    const handleSave = async () => {
        if (!userId || !user) return;

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername) {
            Alert.alert("Error", "Username cannot be empty.");
            return;
        }
        if (!trimmedEmail) {
            Alert.alert("Error", "Email cannot be empty.");
            return;
        }

        setSaving(true);
        try {
            const updateArgs: {
                userId: Id<"users">;
                username?: string;
                email?: string;
                profile_image?: Id<"_storage">;
            } = { userId };

            // Only send changed fields
            if (trimmedUsername !== user.username) updateArgs.username = trimmedUsername;
            if (trimmedEmail !== user.email) updateArgs.email = trimmedEmail;
            if (newStorageId) updateArgs.profile_image = newStorageId;

            await updateProfile(updateArgs);
            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            const message = error?.data || error?.message || "Failed to update profile.";
            Alert.alert("Error", String(message));
        } finally {
            setSaving(false);
        }
    };

    // Determine which avatar to show
    const displayImageUri = photoRemoved ? null : (localImageUri || (profileImageUrl as string | null));
    const hasImage = !!displayImageUri;

    if (!user) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={AppColors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={[AppColors.primary, "#8B80FF"]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTopRow}>
                        <BackButton />
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Avatar with change photo */}
                    <TouchableOpacity
                        onPress={showPhotoOptions}
                        style={styles.avatarContainer}
                        activeOpacity={0.7}
                    >
                        {hasImage ? (
                            <Image
                                source={{ uri: displayImageUri! }}
                                style={styles.avatarImage}
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

                        {/* Camera overlay badge */}
                        <View style={styles.cameraBadge}>
                            {uploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.cameraIcon}>📷</Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.changePhotoLabel}>Tap to change photo</Text>
                </LinearGradient>

                {/* Form */}
                <View style={styles.formSection}>
                    {/* Username */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>👤 Username</Text>
                        <TextInput
                            style={styles.textInput}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter username"
                            placeholderTextColor={AppColors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📧 Email</Text>
                        <TextInput
                            style={styles.textInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter email"
                            placeholderTextColor={AppColors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Non-editable info */}
                    <View style={styles.readonlySection}>
                        <Text style={styles.readonlyTitle}>Account Info</Text>
                        <View style={styles.readonlyRow}>
                            <Text style={styles.readonlyLabel}>🎯 Level</Text>
                            <Text style={styles.readonlyValue}>
                                {user.level.charAt(0).toUpperCase() + user.level.slice(1)}
                            </Text>
                        </View>
                        <View style={styles.readonlyDivider} />
                        <View style={styles.readonlyRow}>
                            <Text style={styles.readonlyLabel}>📌 Status</Text>
                            <Text style={styles.readonlyValue}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Save button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving || uploading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[AppColors.primary, AppColors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveBtnGradient}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>💾 Save Changes</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: AppColors.background },
    container: { paddingBottom: AppSpacing.xl },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: AppColors.background,
    },
    header: {
        alignItems: "center",
        paddingTop: 52,
        paddingBottom: AppSpacing.xl,
        gap: 6,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: AppSpacing.md,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    avatarContainer: {
        position: "relative",
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.5)",
    },
    avatarFallback: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.5)",
    },
    avatarText: {
        fontSize: 42,
        fontWeight: "800",
        color: "#fff",
    },
    cameraBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: AppColors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    cameraIcon: {
        fontSize: 16,
    },
    changePhotoLabel: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 4,
    },
    formSection: {
        paddingHorizontal: AppSpacing.lg,
        paddingTop: AppSpacing.lg,
        gap: 18,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: AppColors.textSecondary,
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: AppColors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: AppColors.border,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        color: AppColors.text,
        fontWeight: "500",
    },
    readonlySection: {
        backgroundColor: AppColors.surface,
        borderRadius: Radius.lg,
        padding: 16,
        marginTop: 6,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    readonlyTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: AppColors.textMuted,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    readonlyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    readonlyLabel: {
        fontSize: 14,
        color: AppColors.textSecondary,
        fontWeight: "500",
    },
    readonlyValue: {
        fontSize: 14,
        color: AppColors.text,
        fontWeight: "600",
    },
    readonlyDivider: {
        height: 1,
        backgroundColor: AppColors.border,
    },
    buttonSection: {
        paddingHorizontal: AppSpacing.lg,
        paddingTop: AppSpacing.xl,
        gap: 12,
    },
    saveBtn: {
        borderRadius: Radius.lg,
        overflow: "hidden",
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnGradient: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 54,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    cancelBtn: {
        borderWidth: 2,
        borderColor: AppColors.border,
        borderRadius: Radius.lg,
        paddingVertical: 14,
        alignItems: "center",
    },
    cancelBtnText: {
        color: AppColors.textSecondary,
        fontSize: 15,
        fontWeight: "600",
    },
});
