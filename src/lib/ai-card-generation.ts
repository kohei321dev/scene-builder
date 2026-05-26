import type { SceneCard } from "@/lib/scenes";

export type GenerateCardInput = {
  category: string;
  sceneJa: string;
  tags: string[];
};

type XaiResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

type GeneratedCardPayload = {
  category?: unknown;
  sceneJa?: unknown;
  promptEn?: unknown;
  promptJa?: unknown;
  tags?: unknown;
  levels?: unknown;
};

type GeneratedLevelPayload = {
  level?: unknown;
  name?: unknown;
  constraints?: unknown;
  answerEn?: unknown;
  answerJa?: unknown;
  reviewPoints?: unknown;
};

export class MissingCardGenerationApiKeyError extends Error {
  constructor() {
    super("GROK_API_KEY is not configured.");
    this.name = "MissingCardGenerationApiKeyError";
  }
}

export async function generateSceneCardWithAi({
  category,
  sceneJa,
  tags,
}: GenerateCardInput): Promise<SceneCard> {
  const apiKey = getAiApiKey();

  if (!apiKey) {
    throw new MissingCardGenerationApiKeyError();
  }

  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-4.3",
      input: [
        {
          role: "system",
          content: [
            "あなたは英検3級レベルから日常英会話を伸ばす英語教材作成者です。",
            "スケボー中に自然に使える短い英文練習カードを作ります。",
            "必ずJSONだけを返してください。Markdownやコードフェンスは不要です。",
          ].join("\n"),
        },
        {
          role: "user",
          content: buildCardPrompt({ category, sceneJa, tags }),
        },
      ],
      max_output_tokens: 1200,
      reasoning: {
        effort: getReasoningEffort(),
      },
      store: false,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as XaiResponsesApiResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message || `AI card generation failed. status=${response.status}`,
    );
  }

  const content = getResponseText(data);

  if (!content) {
    throw new Error("AI card generation response was empty.");
  }

  return normalizeGeneratedCard(parseJsonObject(content), { category, sceneJa, tags });
}

function buildCardPrompt({ category, sceneJa, tags }: GenerateCardInput): string {
  return [
    "次の日本語シチュエーションから、英語練習カードを1つ作ってください。",
    "",
    `カテゴリ: ${category}`,
    `日本語シチュエーション: ${sceneJa}`,
    `タグ: ${tags.join(";") || "なし"}`,
    "",
    "要件:",
    "- promptEnは英語で、学習者への短い指示にする",
    "- promptJaは日本語で、学習者への短い指示にする",
    "- levelsはL1からL4まで必ず4件",
    "- L1は1文でかなり簡単",
    "- L2は1文で少し情報を足す",
    "- L3は2文で理由や補足を足す",
    "- L4は2文で会話の続きになる質問を足す",
    "- answerEnは自然で短い英語",
    "- answerJaはanswerEnの自然な日本語訳",
    "- reviewPointsはそのレベルで意識する点を短く書く",
    "",
    "返却JSONの形:",
    JSON.stringify({
      category: "practice",
      sceneJa: "外国人の友達に今日の練習メニューを話す",
      promptEn: "Tell your friend what you want to practice today.",
      promptJa: "今日練習したいことを友達に伝えてください。",
      tags: ["practice", "friend"],
      levels: [
        {
          level: "L1",
          name: "Verb focus",
          constraints: "1 sentence, 4-7 words, use simple verbs",
          answerEn: "I want to practice ollies.",
          answerJa: "オーリーを練習したいです。",
          reviewPoints: "Use I want to + verb.",
        },
        {
          level: "L2",
          name: "Add detail",
          constraints: "1 sentence, add today",
          answerEn: "I want to practice ollies today.",
          answerJa: "今日はオーリーを練習したいです。",
          reviewPoints: "Add a time expression.",
        },
        {
          level: "L3",
          name: "Reason",
          constraints: "2 sentences, add a reason",
          answerEn: "I want to practice ollies today. My timing feels off.",
          answerJa: "今日はオーリーを練習したいです。タイミングがずれている感じがします。",
          reviewPoints: "Add one reason with a second sentence.",
        },
        {
          level: "L4",
          name: "Conversation",
          constraints: "2 sentences, add a question",
          answerEn: "I want to practice ollies today. What are you working on?",
          answerJa: "今日はオーリーを練習したいです。あなたは何を練習していますか。",
          reviewPoints: "End with a short follow-up question.",
        },
      ],
    }),
  ].join("\n");
}

function normalizeGeneratedCard(
  value: unknown,
  input: GenerateCardInput,
): SceneCard {
  if (!isRecord(value)) {
    throw new Error("AI card generation JSON shape was invalid.");
  }

  const payload = value as GeneratedCardPayload;
  const levels = Array.isArray(payload.levels)
    ? payload.levels
        .map(normalizeLevel)
        .filter((level): level is SceneCard["levels"][number] => Boolean(level))
    : [];

  if (levels.length !== 4) {
    throw new Error("AI card generation must return four levels.");
  }

  return {
    id: `custom-${crypto.randomUUID().slice(0, 8)}`,
    category: getString(payload.category) || input.category,
    sceneJa: getString(payload.sceneJa) || input.sceneJa,
    promptEn: getString(payload.promptEn),
    promptJa: getString(payload.promptJa) || `${input.sceneJa}を英語で伝えてください。`,
    tags: normalizeTags(payload.tags, input.tags),
    levels,
  };
}

function normalizeLevel(value: unknown): SceneCard["levels"][number] | null {
  if (!isRecord(value)) {
    return null;
  }

  const payload = value as GeneratedLevelPayload;
  const level = getString(payload.level);

  if (!["L1", "L2", "L3", "L4"].includes(level)) {
    return null;
  }

  return {
    level,
    name: getString(payload.name) || level,
    constraints: getString(payload.constraints),
    answerEn: getString(payload.answerEn),
    answerJa: getString(payload.answerJa),
    reviewPoints: getString(payload.reviewPoints),
  };
}

function normalizeTags(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => getString(tag)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(";").map((tag) => tag.trim()).filter(Boolean);
  }

  return fallback;
}

function getResponseText(data: XaiResponsesApiResponse): string | undefined {
  if (data.output_text) {
    return data.output_text;
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.text) {
        return content.text;
      }
    }
  }

  return undefined;
}

function getReasoningEffort(): "none" | "low" | "medium" | "high" {
  const effort = process.env.GROK_REASONING_EFFORT || process.env.XAI_REASONING_EFFORT;

  if (
    effort === "none" ||
    effort === "low" ||
    effort === "medium" ||
    effort === "high"
  ) {
    return effort;
  }

  return "none";
}

function getAiApiKey(): string | undefined {
  return process.env.GROK_API_KEY || process.env.XAI_API_KEY;
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error("AI card generation response was not JSON.");
  }

  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
