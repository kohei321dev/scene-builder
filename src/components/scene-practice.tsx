"use client";

import { useMemo, useState } from "react";
import { Check, Eye, RotateCcw, Sparkles } from "lucide-react";

import type { SceneCard } from "@/lib/scenes";

type Props = {
  cards: SceneCard[];
};

type ReviewResult = {
  score: number;
  goodPoint: string;
  fix: string;
  naturalAnswer: string;
  phraseToRemember: string;
  nextPractice: string;
  sceneFit: string;
};

export function ScenePractice({ cards }: Props) {
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? "");
  const [selectedLevel, setSelectedLevel] = useState("L1");
  const [answer, setAnswer] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? cards[0],
    [cards, selectedCardId],
  );

  const selectedLevelData =
    selectedCard?.levels.find((level) => level.level === selectedLevel) ??
    selectedCard?.levels[0];

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  async function handleAiReview() {
    if (!selectedCard || !selectedLevelData) {
      return;
    }

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setReview(null);
      setReviewError("添削する回答を入力してください。");
      return;
    }

    setIsReviewing(true);
    setReviewError(null);
    setReview(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: trimmedAnswer,
          cardId: selectedCard.id,
          level: selectedLevelData.level,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        review?: ReviewResult;
      };

      if (!response.ok || !payload.review) {
        throw new Error(payload.error || "AI添削に失敗しました。");
      }

      setReview(payload.review);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "AI添削に失敗しました。",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div className="practice-shell">
      <aside className="scene-list" aria-label="シーン一覧">
        <div className="sidebar-heading">
          <span>Scenes</span>
          <span>{cards.length}</span>
        </div>
        {cards.map((card) => (
          <button
            className={
              card.id === selectedCard?.id ? "scene-list-item active" : "scene-list-item"
            }
            key={card.id}
            onClick={() => {
              setSelectedCardId(card.id);
              setSelectedLevel(card.levels[0]?.level ?? "L1");
              setAnswer("");
              setShowModel(false);
              setIsDone(false);
              setReview(null);
              setReviewError(null);
            }}
          >
            <span>{card.sceneJa}</span>
            <small>{card.category}</small>
          </button>
        ))}
      </aside>

      <main className="practice-main">
        <section className="prompt-panel">
          <div className="prompt-kicker">{selectedCard?.category}</div>
          <h1>{selectedCard?.sceneJa}</h1>
          <p className="prompt-en">{selectedCard?.promptEn}</p>
          <p className="prompt-ja">{selectedCard?.promptJa}</p>
          <div className="tag-row">
            {selectedCard?.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>

        <section className="work-panel">
          <div className="level-tabs" aria-label="難易度">
            {selectedCard?.levels.map((level) => (
              <button
                className={level.level === selectedLevel ? "active" : ""}
                key={level.level}
                onClick={() => {
                  setSelectedLevel(level.level);
                  setShowModel(false);
                  setReview(null);
                  setReviewError(null);
                }}
              >
                {level.level}
              </button>
            ))}
          </div>

          <div className="level-detail">
            <h2>{selectedLevelData?.name}</h2>
            <p>{selectedLevelData?.constraints}</p>
          </div>

          <label className="answer-label" htmlFor="answer">
            自分の回答
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setReviewError(null);
            }}
            placeholder="例: I practiced ollies today."
            rows={7}
          />

          <div className="action-row">
            <span>{wordCount} words</span>
            <div>
              <button
                className="secondary-button"
                onClick={() => {
                  setAnswer("");
                  setShowModel(false);
                  setIsDone(false);
                  setReview(null);
                  setReviewError(null);
                }}
              >
                <RotateCcw aria-hidden="true" size={16} />
                リセット
              </button>
              <button
                className="secondary-button"
                onClick={() => setShowModel((current) => !current)}
              >
                <Eye aria-hidden="true" size={16} />
                模範回答
              </button>
              <button
                className="secondary-button"
                disabled={isReviewing}
                onClick={handleAiReview}
              >
                <Sparkles aria-hidden="true" size={16} />
                {isReviewing ? "添削中" : "AI添削"}
              </button>
              <button className="primary-button" onClick={() => setIsDone(true)}>
                <Check aria-hidden="true" size={16} />
                完了
              </button>
            </div>
          </div>

          {showModel ? (
            <div className="model-answer">
              <h3>Model answer</h3>
              <p className="model-en">{selectedLevelData?.answerEn}</p>
              <p>{selectedLevelData?.answerJa}</p>
              <small>{selectedLevelData?.reviewPoints}</small>
            </div>
          ) : null}

          {reviewError ? <div className="error-note">{reviewError}</div> : null}

          {review ? (
            <div className="ai-review">
              <div className="review-heading">
                <h3>AI添削</h3>
                <span>{review.score}/10</span>
              </div>
              <dl>
                <div>
                  <dt>よい点</dt>
                  <dd>{review.goodPoint}</dd>
                </div>
                <div>
                  <dt>修正文</dt>
                  <dd>{review.fix}</dd>
                </div>
                <div>
                  <dt>自然な言い方</dt>
                  <dd>{review.naturalAnswer}</dd>
                </div>
                <div>
                  <dt>覚える表現</dt>
                  <dd>{review.phraseToRemember}</dd>
                </div>
                <div>
                  <dt>場面との合い方</dt>
                  <dd>{review.sceneFit}</dd>
                </div>
                <div>
                  <dt>次の練習</dt>
                  <dd>{review.nextPractice}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {isDone ? (
            <div className="done-note">
              保存は次のMVPでlocalStorage化します。今は1シーンの回答練習と認証導線の確認用です。
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
