import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * POST /telegram-webhook
 * Telegram sends all bot updates here.
 * We parse the message and route it to processWebhookMessage action.
 */
http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const update = await req.json() as {
        message?: {
          chat: { id: number };
          text?: string;
        };
      };

      const message = update.message;
      if (!message || !message.text) {
        return new Response("OK", { status: 200 });
      }

      const chatId = String(message.chat.id);
      const text = message.text.trim();

      // Detect /start <token> command
      const startMatch = text.match(/^\/start\s+([A-Z0-9]{6})$/i);
      if (startMatch) {
        const token = startMatch[1].toUpperCase();
        await ctx.runAction(internal.telegram.processWebhookMessage, {
          chatId,
          text,
          token,
        });
      } else {
        await ctx.runAction(internal.telegram.processWebhookMessage, {
          chatId,
          text,
        });
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Webhook error:", err);
      // Always return 200 to Telegram so it doesn't retry endlessly
      return new Response("OK", { status: 200 });
    }
  }),
});

/**
 * GET /telegram-status
 * Simple health-check endpoint to verify webhook is live.
 */
http.route({
  path: "/telegram-status",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    return new Response(
      JSON.stringify({ status: "ok", service: "EduMentor Telegram Webhook" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
