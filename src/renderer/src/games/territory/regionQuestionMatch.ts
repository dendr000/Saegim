import type { Question } from '../../../../shared/types/question';
import type { MapRegion } from './mapSvg';

/**
 * 이 지역 이름으로 태깅된 문제만 골라낸다 (시대/단원 중 하나라도 지역명을 포함하면 매칭).
 * 엄격하게: 매칭되는 게 없으면 그 지역은 이 함수 결과가 빈 배열이 되고, 호출부에서
 * "이 지역엔 낼 문제가 없다"로 처리해야 한다 — 무관한 문제로 대체하지 않는다.
 */
export function findEligibleQuestions(questions: Question[], region: MapRegion): Question[] {
  return questions.filter((question) => question.era.includes(region.label) || question.unit.includes(region.label));
}
