import type { SessionAnswerRecord } from '../../../../shared/types/session';

// 게임 로직이 응답의 출처를 몰라도 되게 하는 정규화된 입력 객체.
// 교사 키보드/클릭에서 왔는지, 나중에 학생 기기(WebSocket)에서 왔는지 이 타입만 봐서는 알 수 없다.
export type Answer = {
  participantId: string;
  value: unknown;
  submittedAt: number;
};

// 점수판이 개인전/팀전을 구분하지 않고 그리기 위한 공통 표시 단위.
export type ParticipantScore = {
  id: string;
  label: string;
  score: number;
};

export type { SessionAnswerRecord };

// 게임이 끝날 때 GameSelect로 넘기는 값 — 최종 점수 + 이번 게임에서 나온 모든 판정.
// GameSelect가 여기에 학급 정보를 더해 세션으로 저장한다.
export type GameFinishPayload = {
  scores: ParticipantScore[];
  answers: SessionAnswerRecord[];
};
