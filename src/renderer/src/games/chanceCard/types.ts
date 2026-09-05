import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type ChanceCardTeamInput = { id: string; label: string };

export type ChanceCardConfig = {
  stealAmount: number;
  teams: ChanceCardTeamInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type TeamRuntimeState = {
  id: string;
  label: string;
  score: number;
  // 다음 한 번의 "점수 훔치기"를 막아주는 1회용 보호막.
  hasShield: boolean;
};

export type DrawnCardType = 'steal' | 'reverse' | 'shield';

export type ChanceCardResult = {
  teamId: string;
  correct: boolean;
  answerText: string;
};

export type ChanceCardState = {
  config: ChanceCardConfig;
  teams: TeamRuntimeState[];
  turnOrder: string[];
  turnIndex: number;
  activeTeamId: string;
  questionQueue: Question[];
  currentQuestion: Question | null;
  // 훔치기 카드를 뽑으면 대상 팀을 고를 때까지 여기 담아둔다 — 그동안 턴은 안 넘어간다.
  pendingCard: DrawnCardType | null;
  lastResult: ChanceCardResult | null;
  // 마지막으로 발동한 카드 로그 — 다음 카드가 발동할 때까지 화면에 계속 보여준다.
  lastCardEvent: string | null;
  status: 'inProgress' | 'finished';
  answerHistory: SessionAnswerRecord[];
};
