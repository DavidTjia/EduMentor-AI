import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/** Register a new user */
export const registerUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    level: v.string(),
  },
  handler: async (ctx, args) => {
    // Check duplicate email
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) throw new ConvexError("Email already registered");

    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      password: args.password,
      level: args.level,
      status: "learning",
      current_step: 1,
      current_topic: "",
      created_at: Date.now(),
    });
    return userId;
  },
});

/** Login — returns user doc or null */
export const loginUser = mutation({
  args: {
    emailOrUsername: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Try email first
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.emailOrUsername))
      .unique();

    // Fallback to username
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.emailOrUsername))
        .unique();
    }

    if (!user || user.password !== args.password) return null;
    return user;
  },
});

/** Get user by id */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/** Update user progress fields */
export const updateUserProgress = mutation({
  args: {
    userId: v.id("users"),
    current_step: v.optional(v.number()),
    current_topic: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.current_step !== undefined) patch.current_step = fields.current_step;
    if (fields.current_topic !== undefined) patch.current_topic = fields.current_topic;
    if (fields.status !== undefined) patch.status = fields.status;
    await ctx.db.patch(userId, patch);
  },
});

/** Reset user progress — back to step 1 */
export const resetUserProgress = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      current_step: 1,
      current_topic: "",
      status: "learning",
    });
  },
});

/** Update Telegram Coach settings for a user */
export const updateTelegramSettings = mutation({
  args: {
    userId: v.id("users"),
    telegram_enabled: v.optional(v.boolean()),
    telegram_chat_id: v.optional(v.string()),
    telegram_token: v.optional(v.string()),
    telegram_waiting_reply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.telegram_enabled !== undefined) patch.telegram_enabled = fields.telegram_enabled;
    if (fields.telegram_chat_id !== undefined) patch.telegram_chat_id = fields.telegram_chat_id;
    if (fields.telegram_token !== undefined) patch.telegram_token = fields.telegram_token;
    if (fields.telegram_waiting_reply !== undefined) patch.telegram_waiting_reply = fields.telegram_waiting_reply;
    await ctx.db.patch(userId, patch);
  },
});

/** Record app login — resets waiting_reply and updates last_app_login */
export const recordAppLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      last_app_login: Date.now(),
      telegram_waiting_reply: false,
    });
  },
});

/** Generate a random 6-char OTP token for Telegram sync */
export const generateSyncToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    await ctx.db.patch(args.userId, { telegram_token: token });
    return token;
  },
});

/** Get all users with Telegram enabled and a valid chat_id */
export const getTelegramEnabledUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("telegram_enabled"), true),
          q.neq(q.field("telegram_chat_id"), undefined)
        )
      )
      .take(200);
  },
});

/** Find user by their Telegram sync token */
export const getUserByTelegramToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegram_token"), args.token))
      .unique();
  },
});

/** Find user by their Telegram chat_id */
export const getUserByTelegramChatId = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegram_chat_id"), args.chatId))
      .unique();
  },
});
