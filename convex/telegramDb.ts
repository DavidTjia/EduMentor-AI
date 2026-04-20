import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Internal Mutations ──────────────────────────────────────────────────────

/** Update Telegram state fields on a user (called from actions) */
export const patchUserTelegramState = internalMutation({
  args: {
    userId: v.id("users"),
    telegram_chat_id: v.optional(v.string()),
    telegram_token: v.optional(v.string()),
    telegram_waiting_reply: v.optional(v.boolean()),
    last_notified_at: v.optional(v.number()),
    telegram_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.telegram_chat_id !== undefined) patch.telegram_chat_id = fields.telegram_chat_id;
    if (fields.telegram_token !== undefined) patch.telegram_token = fields.telegram_token;
    if (fields.telegram_waiting_reply !== undefined) patch.telegram_waiting_reply = fields.telegram_waiting_reply;
    if (fields.last_notified_at !== undefined) patch.last_notified_at = fields.last_notified_at;
    if (fields.telegram_enabled !== undefined) patch.telegram_enabled = fields.telegram_enabled;
    await ctx.db.patch(userId, patch);
  },
});

/** Reschedule: push all incomplete plans forward by 1 day */
export const rescheduleUserPlans = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("is_completed"), false))
      .take(50);

    const oneDayMs = 24 * 60 * 60 * 1000;
    for (const plan of plans) {
      await ctx.db.patch(plan._id, {
        created_at: plan.created_at + oneDayMs,
      });
    }
  },
});

// ─── Internal Queries ────────────────────────────────────────────────────────

/** Find user by Telegram sync token */
export const getUserByTokenQuery = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegram_token"), args.token))
      .unique();
  },
});

/** Find user by Telegram chat_id */
export const getUserByChatIdQuery = internalQuery({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegram_chat_id"), args.chatId))
      .unique();
  },
});

/** Get all users with Telegram enabled (used by cron jobs) */
export const getTelegramUsersForCron = internalQuery({
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

/** Get users pending hourly reminder (waiting_reply + not notified in >1h) */
export const getUsersPendingReminder = internalQuery({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("telegram_enabled"), true),
          q.eq(q.field("telegram_waiting_reply"), true),
          q.lt(q.field("last_notified_at"), oneHourAgo)
        )
      )
      .take(200);
  },
});

/** Get first incomplete learning plan for a user */
export const getTodayPlanForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("is_completed"), false))
      .first();
  },
});

/** Get upcoming incomplete learning plans for a user (up to 3) */
export const getUpcomingPlansForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("is_completed"), false))
      .take(3);
  },
});
