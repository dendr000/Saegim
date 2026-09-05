import type { Question } from '../../../../shared/types/question';

/**
 * Answer.value를 문제 데이터와 대조해 정오를 계산한다.
 * value 모양은 유형별로 다르다: 객관식은 { choiceIndex }, 단답형/이미지 판별은 교사가 직접
 * 판정한 { judgedCorrect }(둘 다 payload.answer를 정답 텍스트로 쓰는 구조가 같다).
 * 타임어택/땅따먹기/모자이크 공개 등 여러 게임 모드가 공유한다.
 */
export function gradeAnswer(question: Question, value: unknown): { correct: boolean; answerText: string } {
  if (question.type === 'multipleChoice') {
    const choiceIndex = (value as { choiceIndex?: number }).choiceIndex;
    return {
      correct: choiceIndex === question.payload.answerIndex,
      answerText: question.payload.choices[question.payload.answerIndex]
    };
  }
  if (question.type === 'shortAnswer' || question.type === 'imageIdentify') {
    const judgedCorrect = Boolean((value as { judgedCorrect?: boolean }).judgedCorrect);
    return { correct: judgedCorrect, answerText: question.payload.answer };
  }
  return { correct: false, answerText: '' };
}
