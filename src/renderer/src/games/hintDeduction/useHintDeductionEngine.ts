import { useReducer } from 'react';
import type { Answer } from '../_shared/types';
import { useCountdownTimer } from '../_shared/useCountdownTimer';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { calculateHintDeductedScore } from './scoring';
import { maxHintsFor } from './hints';
import type { HintDeductionConfig, HintDeductionResult, HintDeductionState } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer }
  | { type: 'REVEAL_HINT' }
  | { type: 'SKIP_QUESTION' }
  | { type: 'TURN_TIME_EXPIRED' }
  | { type: 'SESSION_TIME_EXPIRED' }
  | { type: 'END_ROUND_MANUALLY' }
  | { type: 'ADJUST_SCORE'; participantId: string; newScore: number };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialState(config: HintDeductionConfig): HintDeductionState {
  const turnQuestionQueue = shuffle(config.questions);
  const turnOrder = config.participants.map((participant) => participant.id);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0,
      combo: 0
    })),
    turnQuestionQueue,
    currentQuestion: turnQuestionQueue[0],
    hintsRevealed: 0,
    turnOrder,
    turnIndex: 0,
    activeParticipantId: config.mode === 'hotSeat' ? (turnOrder[0] ?? null) : null,
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

// 다음 참가자의 턴을 새 문제 큐로 시작한다. 마지막 참가자였다면 게임을 끝낸다.
function startNextTurnOrFinish(
  state: HintDeductionState
): Pick<
  HintDeductionState,
  'status' | 'turnIndex' | 'activeParticipantId' | 'turnQuestionQueue' | 'currentQuestion' | 'hintsRevealed'
> {
  const nextTurnIndex = state.turnIndex + 1;
  if (nextTurnIndex >= state.turnOrder.length) {
    return {
      status: 'finished',
      turnIndex: state.turnIndex,
      activeParticipantId: state.activeParticipantId,
      turnQuestionQueue: state.turnQuestionQueue,
      currentQuestion: state.currentQuestion,
      hintsRevealed: state.hintsRevealed
    };
  }
  const turnQuestionQueue = shuffle(state.config.questions);
  return {
    status: 'inProgress',
    turnIndex: nextTurnIndex,
    activeParticipantId: state.turnOrder[nextTurnIndex],
    turnQuestionQueue,
    currentQuestion: turnQuestionQueue[0],
    hintsRevealed: 0
  };
}

function hintDeductionReducer(state: HintDeductionState, action: Action): HintDeductionState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'REVEAL_HINT': {
      if (state.currentQuestion.type !== 'shortAnswer') return state;
      const maxHints = maxHintsFor(state.currentQuestion.payload.answer);
      if (state.hintsRevealed >= maxHints) return state;
      return { ...state, hintsRevealed: state.hintsRevealed + 1 };
    }

    case 'SUBMIT_ANSWER': {
      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const participantId = action.answer.participantId;
      const difficulty = state.currentQuestion.difficulty;
      const hintsRevealed = state.hintsRevealed;

      const participants = state.participants.map((participant) => {
        if (participant.id !== participantId) return participant;
        if (correct) {
          return {
            ...participant,
            combo: participant.combo + 1,
            score: participant.score + calculateHintDeductedScore(difficulty, participant.combo, hintsRevealed)
          };
        }
        return { ...participant, combo: 0 };
      });

      const lastResult: HintDeductionResult = { participantId, correct, answerText };
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];

      // 핫시트: 정오답 관계없이 다음 문제. 동시 진행: 정답일 때만 다음 문제(오답이면 문제 유지).
      const shouldAdvance = state.config.mode === 'hotSeat' || correct;
      if (!shouldAdvance) {
        return { ...state, participants, lastResult, answerHistory };
      }

      const remaining = state.turnQuestionQueue.slice(1);
      if (remaining.length > 0) {
        return {
          ...state,
          participants,
          turnQuestionQueue: remaining,
          currentQuestion: remaining[0],
          hintsRevealed: 0,
          lastResult,
          answerHistory
        };
      }

      // 이번 범위(핫시트: 이 학생의 턴 / 동시 진행: 이번 세션)의 문제를 이미 다 냈다.
      // 그대로 다시 섞어서 반복시키면 이미 아는 정답으로 무한히 점수를 쌓을 수 있어(악용 가능),
      // 여기서 범위를 끝낸다.
      if (state.config.mode === 'simultaneous') {
        return { ...state, participants, status: 'finished', lastResult, answerHistory };
      }
      return { ...state, participants, ...startNextTurnOrFinish(state), lastResult, answerHistory };
    }

    case 'SKIP_QUESTION': {
      const remaining = state.turnQuestionQueue.slice(1);
      if (remaining.length > 0) {
        return { ...state, turnQuestionQueue: remaining, currentQuestion: remaining[0], hintsRevealed: 0, lastResult: null };
      }
      return { ...state, status: 'finished', lastResult: null };
    }

    case 'TURN_TIME_EXPIRED': {
      return { ...state, ...startNextTurnOrFinish(state), lastResult: null };
    }

    case 'END_ROUND_MANUALLY': {
      // 핫시트: 지금 학생 턴을 마치고 다음 학생으로. 동시 진행: 세션 자체를 종료.
      if (state.config.mode === 'hotSeat') {
        return { ...state, ...startNextTurnOrFinish(state), lastResult: null };
      }
      return { ...state, status: 'finished' };
    }

    case 'SESSION_TIME_EXPIRED': {
      return { ...state, status: 'finished' };
    }

    case 'ADJUST_SCORE': {
      // 교사 수동 개입: 판정 실수·점수 오류를 바로잡기 위해 점수를 직접 지정한다.
      const participants = state.participants.map((participant) =>
        participant.id === action.participantId ? { ...participant, score: action.newScore } : participant
      );
      return { ...state, participants };
    }

    default:
      return state;
  }
}

export function useHintDeductionEngine(config: HintDeductionConfig) {
  const [state, dispatch] = useReducer(hintDeductionReducer, config, createInitialState);

  const timer = useCountdownTimer(config.durationSeconds, {
    resetKey: config.mode === 'hotSeat' ? state.turnIndex : undefined,
    onExpire: () => {
      dispatch({ type: config.mode === 'hotSeat' ? 'TURN_TIME_EXPIRED' : 'SESSION_TIME_EXPIRED' });
    }
  });

  function submitAnswer(value: unknown, participantId: string): void {
    dispatch({ type: 'SUBMIT_ANSWER', answer: { participantId, value, submittedAt: Date.now() } });
  }

  function revealHint(): void {
    dispatch({ type: 'REVEAL_HINT' });
  }

  function skipQuestion(): void {
    dispatch({ type: 'SKIP_QUESTION' });
  }

  function endRound(): void {
    dispatch({ type: 'END_ROUND_MANUALLY' });
  }

  function adjustScore(participantId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', participantId, newScore });
  }

  return {
    state,
    remainingSeconds: timer.remainingSeconds,
    isTimerRunning: timer.isRunning,
    pauseTimer: timer.pause,
    resumeTimer: timer.resume,
    resetTimer: timer.reset,
    submitAnswer,
    revealHint,
    skipQuestion,
    endRound,
    adjustScore
  };
}
