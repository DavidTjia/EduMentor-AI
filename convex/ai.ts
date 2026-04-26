"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const MAX_RETRIES = 3;

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
      // Rate limited — wait and retry
      const waitMs = (attempt + 1) * 8000; // 8s, 16s
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    const err = await res.text();
    let msg = `Gemini API error: ${res.statusText}. ${err}`;
    if (res.status === 429) msg = `AI quota exceeded: ${err}`;
    throw new ConvexError(msg);
  }

  throw new ConvexError("Gemini API failed after retries");
}

/** Generate a structured learning plan for a user */
export const generateLearningPlan = action({
  args: {
    userId: v.id("users"),
    level: v.string(),
    cycleId: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const prompt = `
You are an AI tutor creating a personalized Python programming learning plan.
Student level: ${args.level} (beginner = complete novice, basic = some exposure).
Generate exactly 5 topics for this student in sequential order.
Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {
    "step": 1,
    "topic": "Topic Name",
    "description": "2-sentence description of what the student will learn",
    "estimated_time": 10
  },
  ...
]
estimated_time is in minutes (10 or 15).
`;

    const raw = await callGemini(prompt);

    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Invalid AI response format");

    type PlanItem = {
      step: number;
      topic: string;
      description: string;
      estimated_time: number;
    };

    const topics: PlanItem[] = JSON.parse(match[0]);

    await ctx.runMutation(api.learningPlans.createLearningPlan, {
      userId: args.userId,
      cycleId: args.cycleId,
      topics,
    });

    // Set the first topic on the user
    if (topics.length > 0) {
      await ctx.runMutation(api.users.updateUserProgress, {
        userId: args.userId,
        current_step: 1,
        current_topic: topics[0].topic,
        status: "learning",
      });
    }
  },
});

/** Generate lesson: material + quiz in ONE API call to save quota */
export const generateLesson = action({
  args: {
    topic: v.string(),
    level: v.string(),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{
    material: {
      explanation: string;
      code_example: string;
      key_points: string[];
    };
    questions: Array<{
      question: string;
      choices: string[];
      correct_index: number;
      explanation: string;
    }>;
  }> => {
    const prompt = `
You are a Python tutor. Generate a complete lesson for the topic below.
Topic: "${args.topic}"
Level: ${args.level}

Respond ONLY with valid JSON, no markdown:
{
  "material": {
    "explanation": "Clear 5-6 sentence explanation of the topic. Cover what it is, why it matters, and how to use it in Python.",
    "code_example": "# A practical Python code example with comments\\nprint('hello')",
    "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"]
  },
  "questions": [
    {
      "question": "Question text?",
      "choices": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Why this is correct."
    }
  ]
}

RULES:
- explanation: 5-6 clear sentences.
- code_example: 1 practical example with comments.
- key_points: exactly 4 points.
- questions: exactly 3 multiple choice questions, easy to hard, 4 choices each.
- correct_index is 0-based.
`;

    const raw = await callGemini(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid lesson response format");
    const parsed = JSON.parse(match[0]);
    
    // Ensure structure
    return {
      material: parsed.material ?? {
        explanation: parsed.explanation ?? "",
        code_example: parsed.code_example ?? "",
        key_points: parsed.key_points ?? [],
      },
      questions: parsed.questions ?? [],
    };
  },
});

/** Ask AI tutor — context-aware question answering */
export const askAITutor = action({
  args: {
    topic: v.string(),
    question: v.string(),
  },
  handler: async (_ctx, args): Promise<string> => {
    const prompt = `
You are a strict but friendly Python tutor helping a student learn "${args.topic}".
Student question: "${args.question}"

CRITICAL RULES:
1. You MUST ONLY answer questions related to Python programming, coding, or the current topic.
2. If the user asks about ANYTHING ELSE (e.g., politics, history, general trivia, translation, "who is the president", etc.), you MUST politely REFUSE to answer.
3. If refusing, say something like: "I'm your Python tutor! 🐍 I can only help you with programming and topics related to Python. Let's get back to coding!"
4. Give a clear, concise, encouraging answer in 2-4 sentences.
`;

    return await callGemini(prompt);
  },
});
