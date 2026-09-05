import type { Question } from '../../../../shared/types/question';

// 골든벨은 학생이 화이트보드 등으로 답을 보이면 교사가 맞았는지만 판정하는
// 방식이라(어떤 보기를 골랐는지 앱이 추적하지 않음), gradeAnswer의 choiceIndex
// 비교 로직을 쓸 수 없다 — 정답 텍스트만 별도로 뽑아 보여준다.
export function correctAnswerText(question: Question): string {
  if (question.type === 'multipleChoice') return question.payload.choices[question.payload.answerIndex];
  if (question.type === 'shortAnswer') return question.payload.answer;
  return '';
}
