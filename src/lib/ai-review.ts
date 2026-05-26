import type { SceneCard } from "@/lib/scenes";

export type ReviewResult = {
  score: number;
  goodPoint: string;
  fix: string;
  naturalAnswer: string;
  phraseToRemember: string;
  nextPractice: string;
  sceneFit: string;
};

type ReviewInput = {
  answer: string;
  card: SceneCard;
  level: SceneCard["levels"][number];
};

type XaiResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export class MissingAiApiKeyError extends Error {
  constructor() {
    super("GROK_API_KEY is not configured.");
    this.name = "MissingAiApiKeyError";
  }
}

const fallbackReview: ReviewResult = {
  score: 0,
  goodPoint: "",
  fix: "",
  naturalAnswer: "",
  phraseToRemember: "",
  nextPractice: "",
  sceneFit: "",
};

export function isAiReviewConfigured(): boolean {
  return Boolean(getAiApiKey());
}

export async function reviewAnswerWithAi({
  answer,
  card,
  level,
}: ReviewInput): Promise<ReviewResult> {
  const apiKey = getAiApiKey();

  if (!apiKey) {
    throw new MissingAiApiKeyError();
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
            "あなたは英検3級レベルから日常英会話を伸ばす英語コーチです。",
            "目的は、スケボー中の自然な会話で使える短い英文を増やすことです。",
            "説明は日本語で短く、回答例は英語で返してください。",
            "必ずJSONだけを返してください。Markdownやコードフェンスは不要です。",
          ].join("\n"),
        },
        {
          role: "user",
          content: buildReviewPrompt({ answer, card, level }),
        },
      ],
      max_output_tokens: 700,
      reasoning: {
        effort: getReasoningEffort(),
      },
      store: false,
      temperature: 0.2,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as XaiResponsesApiResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message || `AI review request failed. status=${response.status}`,
    );
  }

  const content = getResponseText(data);

  if (!content) {
    throw new Error("AI review response was empty.");
  }

  return normalizeReviewResult(parseJsonObject(content));
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

function getAiApiKey(): string | undefined {
  return process.env.GROK_API_KEY || process.env.XAI_API_KEY;
}

function buildReviewPrompt({ answer, card, level }: ReviewInput): string {
  return [
    "次の条件で学習者の英文をレビューしてください。",
    "",
    `カードID: ${card.id}`,
    `カテゴリ: ${card.category}`,
    `日本語シーン: ${card.sceneJa}`,
    `英語シーン: ${card.promptEn}`,
    `日本語指示: ${card.promptJa}`,
    `対象レベル: ${level.level} (${level.name})`,
    `制約: ${level.constraints}`,
    `模範回答: ${level.answerEn}`,
    `学習者の回答: ${answer}`,
    "",
    "返却JSONの形:",
    JSON.stringify({
      score: 8,
      goodPoint: "意味が伝わっています。",
      fix: "I want to practice kickflips today.",
      naturalAnswer: "I want to work on kickflips today.",
      phraseToRemember: "work on ...",
      nextPractice: "理由をbecauseで1つ足してみましょう。",
      sceneFit: "今日の練習メニューを友達に伝える場面に合っています。",
    }),
  ].join("\n");
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error("AI review response was not JSON.");
  }

  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
}

function normalizeReviewResult(value: unknown): ReviewResult {
  if (!isRecord(value)) {
    throw new Error("AI review JSON shape was invalid.");
  }

  return {
    ...fallbackReview,
    score: clampScore(value.score),
    goodPoint: getString(value.goodPoint),
    fix: getString(value.fix),
    naturalAnswer: getString(value.naturalAnswer),
    phraseToRemember: getString(value.phraseToRemember),
    nextPractice: getString(value.nextPractice),
    sceneFit: getString(value.sceneFit),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function clampScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(score)));
}
