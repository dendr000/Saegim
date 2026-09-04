import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type BombPassParticipantInput = { id: string; label: string };

export type BombPassConfig = {
  minRoundSeconds: number;
  maxRoundSeconds: number;
  bombPenalty: number;
  participants: BombPassParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
  combo: number;
  bombHitCount: number;
};

export type BombPassResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
};

export type BombPassExplosion = {
  participantId: string;
  label: string;
};

export type BombPassState = {
  config: BombPassConfig;
  participants: ParticipantRuntimeState[];
  // 이번 라운드 이후 아직 안 낸 문제 큐. 앞에서부터 하나씩 소비하고, 비면 게임을
  // 끝낸다 — 같은 문제를 반복해서 이미 아는 정답으로 점수를 무한히 쌓는 것을 막는다.
  questionQueue: Question[];
  currentQuestion: Question | null;
  // 원형으로 순환하는 턴 순서 — 마지막 참가자 다음은 다시 처음 참가자.
  turnOrder: string[];
  turnIndex: number;
  activeParticipantId: string;
  // 이번 라운드에 배정된 (숨겨진) 폭탄 대기시간 — 화면엔 표시하지 않는다.
  currentRoundSeconds: number;
  status: 'inProgress' | 'finished';
  lastResult: BombPassResult | null;
  // 마지막으로 터진 사람 — 다음 폭발이 있을 때까지 화면에 계속 보여준다.
  lastExplosion: BombPassExplosion | null;
  answerHistory: SessionAnswerRecord[];
};
