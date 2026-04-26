import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 🌙 Daily Plan — runs every day at 19:50 WITA (UTC+8 = 11:50 UTC)
 * Sends today's learning schedule to all Telegram-enabled users.
 */
crons.cron(
  "send daily learning plan",
  "50 11 * * *", // 11:50 UTC = 19:50 WITA
  internal.telegram.runMorningDailyPlan,
  {}
);

/**
 * ⏰ Hourly Reminder — runs every hour
 * Sends follow-up nudges to users who haven't replied or logged in.
 */
crons.interval(
  "send hourly reminders",
  { hours: 1 },
  internal.telegram.runHourlyReminder,
  {}
);

export default crons;
