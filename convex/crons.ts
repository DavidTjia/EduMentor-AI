import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 🌅 Daily Plan — runs every day at 08:00 WIB (UTC+8 = 00:00 UTC)
 * Sends today's learning schedule to all Telegram-enabled users.
 */
crons.cron(
  "send daily learning plan",
  "0 0 * * *", // 00:00 UTC = 08:00 WIB
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
