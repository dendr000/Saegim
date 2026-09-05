import type { Difficulty } from '../../../../shared/types/question';

const MAX_SPEED_BONUS = 50;

/**
 * 점수 = 난이도 기본 점수 + 속도 보너스. 이미지가 많이 흐릴 때(남은 시간이 많을 때)
 * 맞힐수록 보너스가 커진다 — "빨리 맞힐수록 고득점"이라는 모자이크 공개의 핵심 규칙.
 * remainingSeconds/totalSeconds가 1에 가까울수록(막 시작해서 아직 안 흐려짐) 보너스가 최대,
 * 0에 가까울수록(거의 다 풀림) 보너스가 0에 가까워진다.
 */
export function calculateMosaicScore(
  difficulty: Difficulty,
  remainingSeconds: number,
  totalSeconds: number
): number {
  const speedRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;
  return difficulty * 10 + Math.round(speedRatio * MAX_SPEED_BONUS);
}
