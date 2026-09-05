import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { useCountdownTimer } from '../_shared/useCountdownTimer';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { calculateMosaicScore } from './scoring';
import type { MosaicRevealConfig, MosaicRevealResult, MosaicRevealState } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer; remainingSecondsAtAnswer: number }
  | { type: 'SKIP_QUESTION' }
  | { type: 'REVEAL_TIME_EXPIRED' }
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

function createInitialState(config: MosaicRevealConfig): MosaicRevealState {
  const questionQueue = shuffle(config.questions);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0
    })),
    questionQueue,
    currentQuestion: questionQueue[0] ?? null,
    roundKey: 0,
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

function nextQuestionOrFinish(
  questionQueue: Question[],
  roundKey: number
): Pick<MosaicRevealState, 'status' | 'questionQueue' | 'currentQuestion' | 'roundKey'> {
  const remaining = questionQueue.slice(1);
  if (remaining.length === 0) {
    return { status: 'finished', questionQueue: remaining, currentQuestion: null, roundKey };
  }
  return { status: 'inProgress', questionQueue: remaining, currentQuestion: remaining[0], roundKey: roundKey + 1 };
}

function mosaicRevealReducer(state: MosaicRevealState, action: Action): MosaicRevealState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SUBMIT_ANSWER': {
      if (!state.currentQuestion) return state;
      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const participantId = action.answer.participantId;
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];
      const lastResult: MosaicRevealResult = { participantId, correct, answerText };

      if (!correct) {
        // 동시 진행 모드와 같은 이유 — 오답이면 문제를 유지해 다른 참가자가 다시 시도할 수 있게 한다.
        return { ...state, lastResult, answerHistory };
      }

      const bonus = calculateMosaicScore(
        state.currentQuestion.difficulty,
        action.remainingSecondsAtAnswer,
        state.config.revealSeconds
      );
      const participants = state.participants.map((participant) =>
        participant.id === participantId ? { ...participant, score: participant.score + bonus } : participant
      );

      return {
        ...state,
        participants,
        ...nextQuestionOrFinish(state.questionQueue, state.roundKey),
        lastResult,
        answerHistory
      };
    }

    case 'SKIP_QUESTION': {
      return { ...state, ...nextQuestionOrFinish(state.questionQueue, state.roundKey), lastResult: null };
    }

    case 'REVEAL_TIME_EXPIRED': {
      return { ...state, ...nextQuestionOrFinish(state.questionQueue, state.roundKey), lastResult: null };
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

export function useMosaicRevealEngine(config: MosaicRevealConfig) {
  const [state, dispatch] = useReducer(mosaicRevealReducer, config, createInitialState);

  const timer = useCountdownTimer(config.revealSeconds, {
    resetKey: state.roundKey,
    onExpire: () => dispatch({ type: 'REVEAL_TIME_EXPIRED' })
  });

  function submitAnswer(participantId: string, judgedCorrect: boolean): void {
    dispatch({
      type: 'SUBMIT_ANSWER',
      answer: { participantId, value: { judgedCorrect }, submittedAt: Date.now() },
      remainingSecondsAtAnswer: timer.remainingSeconds
    });
  }

  function skipQuestion(): void {
    dispatch({ type: 'SKIP_QUESTION' });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
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
    skipQuestion,
    endGame,
    adjustScore
  };
}
