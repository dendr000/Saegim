import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type TimeAttackMode = 'hotSeat' | 'simultaneous';

export type TimeAttackParticipantInput = { id: string; label: string };

export type TimeAttackConfig = {
  mode: TimeAttackMode;
  durationSeconds: number;
  participants: TimeAttackParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
  combo: number;
};

export type TimeAttackResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
};

export type TimeAttackState = {
  config: TimeAttackConfig;
  participants: ParticipantRuntimeState[];
  // 이번 범위(핫시트는 현재 학생의 턴, 동시 진행은 세션 전체)에서 아직 내지 않은 문제 큐.
  // 앞에서부터 하나씩 소비하고, 비면 그 범위를 끝낸다 — 같은 문제를 반복해서
  // 이미 아는 정답으로 점수를 무한히 쌓는 것을 막기 위함이다.
  turnQuestionQueue: Question[];
  currentQuestion: Question;
  turnOrder: string[];
  turnIndex: number;
  // 핫시트: turnOrder[turnIndex]. 동시 진행: 교사가 매번 선택하므로 항상 null.
  activeParticipantId: string | null;
  status: 'inProgress' | 'finished';
  lastResult: TimeAttackResult | null;
  // 세션 기록·오답 통계용으로 이번 게임에서 나온 모든 판정을 쌓아둔다.
  answerHistory: SessionAnswerRecord[];
};
