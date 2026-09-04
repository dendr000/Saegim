/**
 * 정답 시 획득 점수 = 난이도 × 10 × 콤보단계.
 * comboBeforeThisAnswer는 이번 정답 "이전"까지의 연속 정답 수 (오답 시 0으로 초기화됨).
 * 예: 난이도 2, 이전에 2연속 정답(comboBeforeThisAnswer=2) → 이번이 3번째 콤보 → 2*10*3=60점.
 */
export function calculateScoreForCorrectAnswer(difficulty: 1 | 2 | 3, comboBeforeThisAnswer: number): number {
  const comboLevel = comboBeforeThisAnswer + 1;
  return difficulty * 10 * comboLevel;
}
