"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const MAX_RETRIES = 3;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callTelegramAPI(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      return data.candidates[0]?.content?.parts[0]?.text ?? "";
    }

    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      const waitMs = (attempt + 1) * 8000;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    const err = await res.text();
    throw new Error(`Gemini error: ${res.statusText}. ${err}`);
  }

  throw new Error("Gemini API failed after retries");
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Send daily learning plan to a single user via Telegram.
 */
export const sendDailyPlan = internalAction({
  args: {
    userId: v.id("users"),
    chatId: v.string(),
    username: v.string(),
    topic: v.string(),
    description: v.string(),
    estimatedMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const prompt = `
Kamu adalah asisten belajar bernama EduMentor AI yang ramah dan memotivasi.
Buat pesan pagi hari yang singkat (maks 4 kalimat) untuk pengguna bernama ${args.username}.
Topik belajar hari ini: "${args.topic}" (${args.description}).
Estimasi waktu: ${args.estimatedMinutes} menit.
Gunakan Bahasa Indonesia yang santai dan menyemangati. Akhiri dengan:
"Siap mulai belajar sekarang? Balas 'ya' untuk mulai, atau beritahu aku jika ada kendala!"
Jangan gunakan markdown/asterisk, gunakan plain text saja.
`;
    let message = "";
    try {
      message = await callGemini(prompt);
    } catch {
      message = `Selamat pagi ${args.username}! 🌅\n\nHari ini kamu dijadwalkan belajar "${args.topic}" selama ${args.estimatedMinutes} menit.\n\n${args.description}\n\nSiap mulai belajar sekarang? Balas 'ya' untuk mulai, atau beritahu aku jika ada kendala!`;
    }

    await callTelegramAPI("sendMessage", {
      chat_id: args.chatId,
      text: `🎓 EduMentor Daily Plan\n\n${message}`,
    });

    await ctx.runMutation(internal.telegramDb.patchUserTelegramState, {
      userId: args.userId,
      telegram_waiting_reply: true,
      last_notified_at: Date.now(),
    });
  },
});

/**
 * Send a follow-up reminder to a user who hasn't replied.
 */
export const sendReminder = internalAction({
  args: {
    userId: v.id("users"),
    chatId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `
Kamu adalah asisten belajar EduMentor AI yang peduli.
Pengguna bernama ${args.username} belum membalas pesan belajar hariannya sejak 1 jam lalu.
Buat pesan pengingat singkat (2-3 kalimat) yang ramah tapi sedikit mendesak dalam Bahasa Indonesia.
Variasikan pesannya agar tidak monoton. Jangan gunakan markdown, gunakan plain text.
`;
    let message = "";
    try {
      message = await callGemini(prompt);
    } catch {
      message = `Hei ${args.username}! 👋 Masih ingat jadwal belajar hari ini? Jangan ditunda ya, konsistensi adalah kunci sukses belajar! Balas pesanku kalau kamu butuh bantuan.`;
    }

    await callTelegramAPI("sendMessage", {
      chat_id: args.chatId,
      text: `⏰ Pengingat Belajar\n\n${message}`,
    });

    await ctx.runMutation(internal.telegramDb.patchUserTelegramState, {
      userId: args.userId,
      last_notified_at: Date.now(),
    });
  },
});

/**
 * Process an incoming message from Telegram (via webhook).
 */
export const processWebhookMessage = internalAction({
  args: {
    chatId: v.string(),
    text: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ── /start <token> flow: link Telegram account ──
    if (args.token) {
      const user = await ctx.runQuery(internal.telegramDb.getUserByTokenQuery, {
        token: args.token,
      });

      if (!user) {
        await callTelegramAPI("sendMessage", {
          chat_id: args.chatId,
          text: "❌ Token tidak valid atau sudah kedaluwarsa. Silakan generate ulang token di aplikasi EduMentor.",
        });
        return;
      }

      await ctx.runMutation(internal.telegramDb.patchUserTelegramState, {
        userId: user._id as Id<"users">,
        telegram_chat_id: args.chatId,
        telegram_token: undefined,
        telegram_enabled: true,
        telegram_waiting_reply: false,
      });

      await callTelegramAPI("sendMessage", {
        chat_id: args.chatId,
        text: `✅ Berhasil! Akun EduMentor kamu (${user.username}) sudah terhubung!\n\nMulai sekarang, aku akan mengirimkan jadwal belajar harianmu setiap hari jam 19:50 WITA. Semangat belajar Python! 🐍🎓`,
      });
      return;
    }

    // ── Normal message: detect intent via Gemini ──
    const user = await ctx.runQuery(internal.telegramDb.getUserByChatIdQuery, {
      chatId: args.chatId,
    });

    if (!user) {
      await callTelegramAPI("sendMessage", {
        chat_id: args.chatId,
        text: "Halo! 👋 Akun kamu belum terhubung dengan EduMentor. Silakan aktifkan fitur Telegram Coach di aplikasi terlebih dahulu.",
      });
      return;
    }

    const intentPrompt = `
Kamu adalah sistem klasifikasi intent untuk aplikasi belajar EduMentor.
Pesan dari pengguna: "${args.text}"

Klasifikasikan intent ke salah satu:
- "reschedule": pengguna tidak bisa belajar hari ini / minta jadwal diundur
- "schedule": pengguna menanyakan jadwal belajarnya (hari ini, besok, ke depannya, dll)
- "confirm": pengguna setuju / siap belajar
- "question": pengguna bertanya tentang materi Python
- "other": pesan tidak jelas

Balas HANYA dengan JSON valid, tanpa markdown:
{
  "intent": "reschedule" | "schedule" | "confirm" | "question" | "other",
  "reply": "pesan balasan dalam Bahasa Indonesia yang ramah (max 3 kalimat)"
}
`;

    let intentData: { intent: string; reply: string } = {
      intent: "other",
      reply: "Oke, pesanmu sudah aku terima! Tetap semangat belajar ya! 💪",
    };

    try {
      const raw = await callGemini(intentPrompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) intentData = JSON.parse(match[0]);
    } catch {
      // keep default
    }

    if (intentData.intent === "reschedule") {
      await ctx.runMutation(internal.telegramDb.rescheduleUserPlans, {
        userId: user._id as Id<"users">,
      });
    } else if (intentData.intent === "schedule") {
      // Fetch upcoming plans from DB
      const upcomingPlans = await ctx.runQuery(internal.telegramDb.getUpcomingPlansForUser, {
        userId: user._id as Id<"users">,
      });
      
      if (upcomingPlans.length > 0) {
        let scheduleText = "📅 Jadwal Belajar Kamu Berikutnya:\n\n";
        upcomingPlans.forEach((p, idx) => {
          let dayLabel = idx === 0 ? "Hari ini" : (idx === 1 ? "Besok" : `H+${idx}`);
          scheduleText += `▪️ ${dayLabel}: ${p.topic}\n   (${p.estimated_time} menit)\n`;
        });
        scheduleText += "\nSemangat terus belajarnya ya! 🚀";
        intentData.reply = scheduleText;
      } else {
        intentData.reply = "🎉 Selamat! Kamu tidak punya jadwal yang pending saat ini. Kamu sudah menyelesaikan semua topik di siklus belajarmu.";
      }
    } else if (intentData.intent === "question") {
      // Fetch the user's current learning topic for context-aware answers
      const currentPlan = await ctx.runQuery(internal.telegramDb.getTodayPlanForUser, {
        userId: user._id as Id<"users">,
      });
      const currentTopic = currentPlan?.topic ?? "Python dasar";

      const pythonPrompt = `
Kamu adalah EduMentor AI, tutor Python yang ahli, ramah, dan sabar untuk pemula.
Pengguna bernama ${user.username} bertanya melalui Telegram:
"${args.text}"

Materi yang sedang dipelajari pengguna saat ini: "${currentTopic}"

ATURAN PENTING:
1. Jika pertanyaan berkaitan dengan materi "${currentTopic}" atau Python secara umum, berikan penjelasan SINGKAT (5-8 kalimat) yang jelas dan mudah dipahami pemula.
2. Sertakan 1 contoh kode pendek jika relevan (tulis langsung tanpa backtick/markdown).
3. Di akhir jawaban, SELALU tambahkan pesan ini:
   "Untuk penjelasan lengkap, contoh kode interaktif, dan quiz, buka aplikasi EduMentor kamu ya! Materinya lebih detail di sana."
4. Jika pertanyaan TIDAK berkaitan dengan Python/programming, tolak dengan ramah dan arahkan kembali ke belajar Python.

Gunakan Bahasa Indonesia yang santai.
PENTING: Jangan gunakan tanda bintang (*), garis bawah (_), atau format markdown apapun. Gunakan plain text saja.
`;
      try {
        intentData.reply = await callGemini(pythonPrompt);
      } catch {
        intentData.reply = `Pertanyaan bagus, ${user.username}! Sayangnya aku sedang gangguan koneksi.\n\nCoba tanyakan lagi nanti, atau buka aplikasi EduMentor untuk materi lengkap tentang "${currentTopic}" beserta quiz interaktifnya!`;
      }
    }

    // Stop nagging loop whenever user replies
    await ctx.runMutation(internal.telegramDb.patchUserTelegramState, {
      userId: user._id as Id<"users">,
      telegram_waiting_reply: false,
    });

    await callTelegramAPI("sendMessage", {
      chat_id: args.chatId,
      text: intentData.reply,
    });
  },
});

// ─── Cron Orchestrators ──────────────────────────────────────────────────────

/** Morning cron: send daily plan to all eligible Telegram users */
export const runMorningDailyPlan = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(
      internal.telegramDb.getTelegramUsersForCron,
      {}
    );

    for (const user of users) {
      if (!user.telegram_chat_id) continue;

      const plan = await ctx.runQuery(internal.telegramDb.getTodayPlanForUser, {
        userId: user._id,
      });

      if (!plan) continue;

      await ctx.runAction(internal.telegram.sendDailyPlan, {
        userId: user._id,
        chatId: user.telegram_chat_id,
        username: user.username,
        topic: plan.topic,
        description: plan.description,
        estimatedMinutes: plan.estimated_time,
      });
    }
  },
});

/** Hourly cron: remind users who haven't replied */
export const runHourlyReminder = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(
      internal.telegramDb.getUsersPendingReminder,
      {}
    );

    for (const user of users) {
      if (!user.telegram_chat_id) continue;

      // Skip if user was active in app within the last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (user.last_app_login && user.last_app_login > oneHourAgo) {
        await ctx.runMutation(internal.telegramDb.patchUserTelegramState, {
          userId: user._id,
          telegram_waiting_reply: false,
        });
        continue;
      }

      await ctx.runAction(internal.telegram.sendReminder, {
        userId: user._id,
        chatId: user.telegram_chat_id,
        username: user.username,
      });
    }
  },
});
