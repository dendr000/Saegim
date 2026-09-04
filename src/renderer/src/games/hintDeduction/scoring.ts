import { calculateScoreForCorrectAnswer } from '../timeAttack/scoring';

// 힌트 1회당 25%씩 감점 — 기존 콤보 점수 공식은 그대로 재사용하고 배율만 곱한다.
export const HINT_PENALTY_RATIO = 0.25;

export function calculateHintDeductedScore(
  difficulty: 1 | 2 | 3,
  comboBeforeThisAnswer: number,
  hintsUsed: number
): number {
  const baseScore = calculateScoreForCorrectAnswer(difficulty, comboBeforeThisAnswer);
  const multiplier = Math.max(0, 1 - hintsUsed * HINT_PENALTY_RATIO);
  return Math.round(baseScore * multiplier);
}
