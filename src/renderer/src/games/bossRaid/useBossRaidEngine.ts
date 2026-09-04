import { useReducer } from 'react';
import type { Answer } from '../_shared/types';
import { useCountdownTimer } from '../_shared/useCountdownTimer';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { calculateScoreForCorrectAnswer } from '../timeAttack/scoring';
import type { BossRaidConfig, BossRaidResult, BossRaidState } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer }
  | { type: 'SKIP_QUESTION' }
  | { type: 'SESSION_TIME_EXPIRED' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'ADJUST_BOSS_HP'; newHp: number };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialState(config: BossRaidConfig): BossRaidState {
  const turnQuestionQueue = shuffle(config.questions);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0
    })),
    bossHp: config.bossMaxHp,
    combo: 0,
    turnQuestionQueue,
    currentQuestion: turnQuestionQueue[0] ?? null,
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

function bossRaidReducer(state: BossRaidState, action: Action): BossRaidState {
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

      if (!correct) {
        // 협동 게임 — 오답은 개인에게 불이익을 주지 않는다. 학급 전체의 콤보만 끊고,
        // 문제는 그대로 유지해 다른 학생이 다시 시도할 수 있게 한다.
        const lastResult: BossRaidResult = { participantId, correct: false, answerText, damage: 0 };
        return { ...state, combo: 0, lastResult, answerHistory };
      }

      // 데미지 = 기존 타임어택 점수 공식 재사용. 콤보는 개인별이 아니라 학급 전체가
      // 공유 — 서로 다른 학생이 번갈아 맞혀도 계속 쌓인다.
      const damage = calculateScoreForCorrectAnswer(state.currentQuestion.difficulty, state.combo);
      const bossHp = Math.max(0, state.bossHp - damage);
      const combo = state.combo + 1;
      const participants = state.participants.map((participant) =>
        participant.id === participantId ? { ...participant, score: participant.score + damage } : participant
      );
      const lastResult: BossRaidResult = { participantId, correct: true, answerText, damage };

      const remainingQueue = state.turnQuestionQueue.slice(1);
      const finished = bossHp <= 0 || remainingQueue.length === 0;

      return {
        ...state,
        participants,
        bossHp,
        combo,
        turnQuestionQueue: remainingQueue,
        currentQuestion: finished ? null : remainingQueue[0],
        status: finished ? 'finished' : 'inProgress',
        lastResult,
        answerHistory
      };
    }

    case 'SKIP_QUESTION': {
      const remaining = state.turnQuestionQueue.slice(1);
      if (remaining.length > 0) {
        return { ...state, turnQuestionQueue: remaining, currentQuestion: remaining[0], lastResult: null };
      }
      return { ...state, status: 'finished', currentQuestion: null, lastResult: null };
    }

    case 'SESSION_TIME_EXPIRED': {
      return { ...state, status: 'finished' };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'ADJUST_BOSS_HP': {
      // 교사 수동 개입: 보스 레이드의 진짜 상태는 개인 점수가 아니라 보스 체력이라,
      // 판정 실수를 바로잡을 때 이 값을 직접 지정한다.
      const bossHp = Math.max(0, Math.min(state.config.bossMaxHp, action.newHp));
      return { ...state, bossHp };
    }

    default:
      return state;
  }
}

export function useBossRaidEngine(config: BossRaidConfig) {
  const [state, dispatch] = useReducer(bossRaidReducer, config, createInitialState);

  const timer = useCountdownTimer(config.durationSeconds, {
    onExpire: () => dispatch({ type: 'SESSION_TIME_EXPIRED' })
  });

  function submitAnswer(value: unknown, participantId: string): void {
    dispatch({ type: 'SUBMIT_ANSWER', answer: { participantId, value, submittedAt: Date.now() } });
  }

  function skipQuestion(): void {
    dispatch({ type: 'SKIP_QUESTION' });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustBossHp(newHp: number): void {
    dispatch({ type: 'ADJUST_BOSS_HP', newHp });
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
    adjustBossHp
  };
}
