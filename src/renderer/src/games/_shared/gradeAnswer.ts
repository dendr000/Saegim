import type { Question } from '../../../../shared/types/question';

/**
 * Answer.value를 문제 데이터와 대조해 정오를 계산한다.
 * value 모양은 유형별로 다르다: 객관식은 { choiceIndex }, 단답형은 교사가 직접 판정한 { judgedCorrect }.
 * 타임어택/땅따먹기 등 여러 게임 모드가 공유한다 (문제은행 CRUD와 같은 범위: 객관식/단답형만 지원).
 */
export function gradeAnswer(question: Question, value: unknown): { correct: boolean; answerText: string } {
  if (question.type === 'multipleChoice') {
    const choiceIndex = (value as { choiceIndex?: number }).choiceIndex;
    return {
      correct: choiceIndex === question.payload.answerIndex,
      answerText: question.payload.choices[question.payload.answerIndex]
    };
  }
  if (question.type === 'shortAnswer') {
    const judgedCorrect = Boolean((value as { judgedCorrect?: boolean }).judgedCorrect);
    return { correct: judgedCorrect, answerText: question.payload.answer };
  }
  return { correct: false, answerText: '' };
}
