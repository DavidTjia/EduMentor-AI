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
