import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type BossRaidParticipantInput = { id: string; label: string };

export type BossRaidConfig = {
  bossName: string;
  bossMaxHp: number;
  durationSeconds: number;
  participants: BossRaidParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

// 개인 점수 = 그 학생이 직접 기여한 데미지 합(경쟁용이 아니라 기여도 기록용).
export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
};

export type BossRaidResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
  damage: number;
};

export type BossRaidState = {
  config: BossRaidConfig;
  participants: ParticipantRuntimeState[];
  bossHp: number;
  // 반 전체가 공유하는 연속 정답 수 — 개인별이 아니라 학급 전체의 협동 콤보.
  combo: number;
  turnQuestionQueue: Question[];
  currentQuestion: Question | null;
  status: 'inProgress' | 'finished';
  lastResult: BossRaidResult | null;
  answerHistory: SessionAnswerRecord[];
};
