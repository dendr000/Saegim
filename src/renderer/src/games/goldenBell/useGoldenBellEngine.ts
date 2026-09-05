import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { correctAnswerText } from './answerText';
import type { GoldenBellConfig, GoldenBellResult, GoldenBellState, ParticipantRuntimeState } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer }
  | { type: 'FORCE_NEXT_ROUND' }
  | { type: 'GRANT_REVIVAL'; participantId: string }
  | { type: 'REVIVE_MANUALLY'; participantId: string }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'ADJUST_SCORE'; participantId: string; newScore: number };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialState(config: GoldenBellConfig): GoldenBellState {
  const questionQueue = shuffle(config.questions);
  const participants: ParticipantRuntimeState[] = config.participants.map((participant) => ({
    id: participant.id,
    label: participant.label,
    status: 'alive',
    hasRevival: config.initialRevivalParticipantIds.includes(participant.id),
    score: 0
  }));

  return {
    config,
    participants,
    questionQueue,
    currentQuestion: questionQueue[0] ?? null,
    roundParticipantIds: participants.map((participant) => participant.id),
    judgedThisRound: new Set(),
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

// 이번 라운드 문제를 하나 소비하고, 생존자가 1명 이하이거나 문제 큐가 소진되면
// 게임을 끝낸다. 아니면 다음 문제로 새 라운드를 시작한다(그 시점 생존자 전원이
// 이번 라운드 판정 대상).
function advanceRoundOrFinish(
  participants: ParticipantRuntimeState[],
  questionQueue: Question[]
): Pick<GoldenBellState, 'status' | 'questionQueue' | 'currentQuestion' | 'roundParticipantIds' | 'judgedThisRound'> {
  const remaining = questionQueue.slice(1);
  const survivorIds = participants.filter((participant) => participant.status === 'alive').map((p) => p.id);

  if (survivorIds.length <= 1 || remaining.length === 0) {
    return {
      status: 'finished',
      questionQueue: remaining,
      currentQuestion: null,
      roundParticipantIds: survivorIds,
      judgedThisRound: new Set()
    };
  }

  return {
    status: 'inProgress',
    questionQueue: remaining,
    currentQuestion: remaining[0],
    roundParticipantIds: survivorIds,
    judgedThisRound: new Set()
  };
}

function goldenBellReducer(state: GoldenBellState, action: Action): GoldenBellState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SUBMIT_ANSWER': {
      if (!state.currentQuestion) return state;
      const participantId = action.answer.participantId;
      const participant = state.participants.find((candidate) => candidate.id === participantId);
      // 생존자가 아니거나 이번 라운드에 이미 판정된 참가자는 다시 판정하지 않는다.
      if (!participant || participant.status !== 'alive') return state;
      if (state.judgedThisRound.has(participantId)) return state;
      if (!state.roundParticipantIds.includes(participantId)) return state;

      // 골든벨은 학생이 보인 답을 교사가 맞았는지만 판정한다(어떤 보기를 골랐는지
      // 앱이 추적하지 않음) — gradeAnswer 대신 교사의 판정을 그대로 정오답으로 쓴다.
      const correct = Boolean((action.answer.value as { judgedCorrect: boolean }).judgedCorrect);
      const answerText = correctAnswerText(state.currentQuestion);
      let eliminated = false;
      let revivalUsed = false;

      const participants = state.participants.map((candidate) => {
        if (candidate.id !== participantId) return candidate;
        if (correct) return { ...candidate, score: candidate.score + 1 };
        if (candidate.hasRevival) {
          // 부활권을 갖고 있으면 첫 오답은 소비만 하고 탈락시키지 않는다.
          revivalUsed = true;
          return { ...candidate, hasRevival: false };
        }
        eliminated = true;
        return { ...candidate, status: 'eliminated' as const };
      });

      const judgedThisRound = new Set(state.judgedThisRound);
      judgedThisRound.add(participantId);
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];
      const lastResult: GoldenBellResult = { participantId, correct, answerText, eliminated, revivalUsed };

      const roundComplete = state.roundParticipantIds.every((id) => judgedThisRound.has(id));
      if (!roundComplete) {
        return { ...state, participants, judgedThisRound, lastResult, answerHistory };
      }

      return {
        ...state,
        participants,
        lastResult,
        answerHistory,
        ...advanceRoundOrFinish(participants, state.questionQueue)
      };
    }

    case 'FORCE_NEXT_ROUND': {
      // 교사 수동 개입: 아직 판정 안 된 참가자는 그대로 두고(점수·상태 변화 없음)
      // 다음 라운드로 넘어간다.
      return { ...state, ...advanceRoundOrFinish(state.participants, state.questionQueue), lastResult: null };
    }

    case 'GRANT_REVIVAL': {
      // 교사 수동 개입: 상황에 따라 언제든 특정 참가자에게 부활권을 준다(생존/탈락
      // 무관 — 탈락자에게 줘두면 나중에 부활시켰을 때 바로 다시 탈락하지 않는다).
      const participants = state.participants.map((participant) =>
        participant.id === action.participantId ? { ...participant, hasRevival: true } : participant
      );
      return { ...state, participants };
    }

    case 'REVIVE_MANUALLY': {
      // 교사 수동 개입: 탈락 판정을 취소하고 생존 상태로 되돌린다. 이번 라운드
      // 대상 목록엔 원래 없었을 수 있으니(전 라운드에서 탈락해 제외됐던 경우)
      // 지금 라운드에도 포함시키고, "이미 판정됨" 표시도 지워서 이번 라운드에
      // 다시 판정받을 수 있게 한다(오답으로 탈락하면서 이미 judgedThisRound에
      // 들어가 있었을 수 있어서).
      const participants = state.participants.map((participant) =>
        participant.id === action.participantId ? { ...participant, status: 'alive' as const } : participant
      );
      const roundParticipantIds = state.roundParticipantIds.includes(action.participantId)
        ? state.roundParticipantIds
        : [...state.roundParticipantIds, action.participantId];
      const judgedThisRound = new Set(state.judgedThisRound);
      judgedThisRound.delete(action.participantId);
      return { ...state, participants, roundParticipantIds, judgedThisRound };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'ADJUST_SCORE': {
      const participants = state.participants.map((participant) =>
        participant.id === action.participantId ? { ...participant, score: action.newScore } : participant
      );
      return { ...state, participants };
    }

    default:
      return state;
  }
}

export function useGoldenBellEngine(config: GoldenBellConfig) {
  const [state, dispatch] = useReducer(goldenBellReducer, config, createInitialState);

  function submitJudgment(participantId: string, judgedCorrect: boolean): void {
    dispatch({
      type: 'SUBMIT_ANSWER',
      answer: { participantId, value: { judgedCorrect }, submittedAt: Date.now() }
    });
  }

  function forceNextRound(): void {
    dispatch({ type: 'FORCE_NEXT_ROUND' });
  }

  function grantRevival(participantId: string): void {
    dispatch({ type: 'GRANT_REVIVAL', participantId });
  }

  function reviveManually(participantId: string): void {
    dispatch({ type: 'REVIVE_MANUALLY', participantId });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustScore(participantId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', participantId, newScore });
  }

  return { state, submitJudgment, forceNextRound, grantRevival, reviveManually, endGame, adjustScore };
}
