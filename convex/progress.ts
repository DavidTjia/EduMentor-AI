import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Save or update quiz result for a topic */
export const saveQuizResult = mutation({
  args: {
    userId: v.id("users"),
    topic: v.string(),
    score: v.number(),
    is_passed: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if there's an existing record for this topic
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_id_and_topic", (q) =>
        q.eq("user_id", args.userId).eq("topic", args.topic)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        is_passed: args.is_passed,
        attempt: existing.attempt + 1,
        created_at: Date.now(),
      });
    } else {
      await ctx.db.insert("progress", {
        user_id: args.userId,
        topic: args.topic,
        score: args.score,
        attempt: 1,
        is_passed: args.is_passed,
        created_at: Date.now(),
      });
    }
  },
});

/** Get all progress records for a user */
export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .order("asc")
      .take(100);
  },
});

/** Get progress for a specific topic */
export const getTopicResult = query({
  args: { userId: v.id("users"), topic: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_user_id_and_topic", (q) =>
        q.eq("user_id", args.userId).eq("topic", args.topic)
      )
      .unique();
  },
});
