import type { Question } from '../../../../shared/types/question';
import type { MapRegion } from './mapSvg';

export type TerritoryTeam = { id: string; label: string };

export type TerritoryConfig = {
  teams: TerritoryTeam[];
  // 각 지역의 id/label. label로 문항의 era/단원과 대조해 그 지역 전용 문제만 낸다.
  regions: MapRegion[];
  mapSvgContent: string;
  // 객관식/단답형 전체 풀 (지역별로 걸러내는 건 리듀서가 한다).
  questions: Question[];
};

export type TerritoryResult = {
  regionId: string;
  teamId: string;
  correct: boolean;
  answerText: string;
};

export type TerritoryState = {
  config: TerritoryConfig;
  // regionId -> 점령한 팀 id (null이면 미점령)
  regionOwners: Record<string, string | null>;
  currentTeamIndex: number;
  // 판정 대기 중인 칸 (문제가 나와 있고 아직 정오답 판정 전)
  pendingRegionId: string | null;
  currentQuestion: Question | null;
  // 이 지역 이름으로 태깅된 문제가 하나도 없어서 방금 선택이 막힌 경우
  blockedRegionId: string | null;
  status: 'inProgress' | 'finished';
  lastResult: TerritoryResult | null;
};
