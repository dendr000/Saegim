// 힌트 = 정답 앞글자부터 순서대로 공개, 나머지는 빈칸. 항상 최소 한 글자는 가려진
// 채로 남겨서(최대 힌트 횟수 = 글자 수 - 1), 마지막 힌트로 답을 완전히 스포일하지 않는다.
export function maxHintsFor(answer: string): number {
  return Math.max(0, Array.from(answer).length - 1);
}

export function revealHintText(answer: string, hintsRevealed: number): string {
  const chars = Array.from(answer);
  const revealedCount = Math.min(hintsRevealed, chars.length);
  return chars.map((char, index) => (index < revealedCount ? char : '_')).join(' ');
}
