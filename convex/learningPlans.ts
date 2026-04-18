import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Create a batch of learning plan topics for a user/cycle */
export const createLearningPlan = mutation({
  args: {
    userId: v.id("users"),
    cycleId: v.number(),
    topics: v.array(
      v.object({
        step: v.number(),
        topic: v.string(),
        description: v.string(),
        estimated_time: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const t of args.topics) {
      await ctx.db.insert("learning_plans", {
        user_id: args.userId,
        cycle_id: args.cycleId,
        step: t.step,
        topic: t.topic,
        description: t.description,
        estimated_time: t.estimated_time,
        is_completed: false,
        created_at: Date.now(),
      });
    }
  },
});

/** Get full learning plan for a user's current cycle */
export const getUserPlan = query({
  args: { userId: v.id("users"), cycleId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id_and_cycle", (q) =>
        q.eq("user_id", args.userId).eq("cycle_id", args.cycleId)
      )
      .order("asc")
      .take(50);
  },
});

/** Get all plans for a user (all cycles) */
export const getAllUserPlans = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .order("asc")
      .take(100);
  },
});

/** Get today's topic (first incomplete step) */
export const getTodayTopic = query({
  args: { userId: v.id("users"), cycleId: v.number() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("learning_plans")
      .withIndex("by_user_id_and_cycle", (q) =>
        q.eq("user_id", args.userId).eq("cycle_id", args.cycleId)
      )
      .order("asc")
      .take(50);
    return plans.find((p) => !p.is_completed) ?? null;
  },
});

/** Mark a topic as completed */
export const markTopicComplete = mutation({
  args: { planId: v.id("learning_plans") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, { is_completed: true });
  },
});
