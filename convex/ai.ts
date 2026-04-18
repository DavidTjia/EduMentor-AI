"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    let msg = `Gemini API error: ${res.statusText}. ${err}`;
    if (res.status === 429) msg = `AI quota exceeded: ${err}`;
    throw new ConvexError(msg);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text ?? "";
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

/** Generate a quiz question for a topic */
export const generateQuizQuestion = action({
  args: {
    topic: v.string(),
    level: v.string(),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{
    question: string;
    choices: string[];
    correct_index: number;
    explanation: string;
  }> => {
    const prompt = `
You are a Python quiz generator.
Topic: "${args.topic}"
Level: ${args.level}
Create ONE multiple choice question about Python programming for this topic.
Respond ONLY with valid JSON, no markdown:
{
  "question": "Question text here?",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "explanation": "Brief explanation of why the answer is correct."
}
correct_index is 0-based index of the correct choice.
`;

    const raw = await callGemini(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid quiz response format");
    return JSON.parse(match[0]);
  },
});

/** Generate learning material for a topic */
export const generateLearningMaterial = action({
  args: {
    topic: v.string(),
    level: v.string(),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{
    explanation: string;
    code_example: string;
    key_points: string[];
  }> => {
    const prompt = `
You are a Python tutor.
Topic: "${args.topic}"
Level: ${args.level}
Generate learning material. Respond ONLY with valid JSON, no markdown:
{
  "explanation": "Clear 3-4 sentence explanation suitable for the level",
  "code_example": "# Python code example\\nprint('example')",
  "key_points": ["Point 1", "Point 2", "Point 3"]
}
`;

    const raw = await callGemini(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid material response");
    return JSON.parse(match[0]);
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
