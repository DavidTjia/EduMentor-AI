import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Start a new learning session */
export const startSession = mutation({
  args: {
    userId: v.id("users"),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("learning_sessions", {
      user_id: args.userId,
      topic: args.topic,
      start_time: Date.now(),
      completed: false,
    });
  },
});

/** End a session with optional score */
export const endSession = mutation({
  args: {
    sessionId: v.id("learning_sessions"),
    score: v.optional(v.number()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      end_time: Date.now(),
      score: args.score,
      completed: args.completed,
    });
  },
});

/** Get all sessions for a user */
export const getSessionsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learning_sessions")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .order("desc")
      .take(50);
  },
});
