import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // 👤 USERS
  users: defineTable({
    username: v.string(),
    email: v.string(),
    password: v.string(),

    level: v.string(),        // "beginner" | "basic"
    status: v.string(),       // "learning" | "paused" | "completed"

    current_step: v.number(),
    current_topic: v.string(),

    created_at: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // 📚 LEARNING PLAN (AI GENERATED)
  learning_plans: defineTable({
    user_id: v.id("users"),

    cycle_id: v.number(),

    step: v.number(),
    topic: v.string(),
    description: v.string(),

    estimated_time: v.number(), // minutes

    is_completed: v.boolean(),

    created_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_user_id_and_cycle", ["user_id", "cycle_id"]),

  // 📊 PROGRESS (QUIZ RESULTS)
  progress: defineTable({
    user_id: v.id("users"),

    topic: v.string(),
    score: v.number(),

    attempt: v.number(),

    is_passed: v.boolean(),

    created_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_user_id_and_topic", ["user_id", "topic"]),

  // 📘 LEARNING SESSION (TRACKING)
  learning_sessions: defineTable({
    user_id: v.id("users"),

    topic: v.string(),

    start_time: v.number(),
    end_time: v.optional(v.number()),

    score: v.optional(v.number()),

    completed: v.boolean(),
  })
    .index("by_user_id", ["user_id"]),

});