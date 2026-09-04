import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { findEligibleQuestions } from './regionQuestionMatch';
import type { TerritoryConfig, TerritoryState } from './types';

type Action =
  | { type: 'SELECT_REGION'; regionId: string }
  | { type: 'JUDGE_ANSWER'; answer: Answer }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'REASSIGN_REGION'; regionId: string; newOwnerTeamId: string | null };

function pickRandomQuestion(questions: Question[]): Question {
  return questions[Math.floor(Math.random() * questions.length)];
}

function createInitialState(config: TerritoryConfig): TerritoryState {
  const regionOwners: Record<string, string | null> = {};
  config.regions.forEach((region) => {
    regionOwners[region.id] = null;
  });

  return {
    config,
    regionOwners,
    currentTeamIndex: 0,
    pendingRegionId: null,
    currentQuestion: null,
    blockedRegionId: null,
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

function allRegionsOwned(regionOwners: Record<string, string | null>): boolean {
  return Object.values(regionOwners).every((owner) => owner !== null);
}

function territoryReducer(state: TerritoryState, action: Action): TerritoryState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SELECT_REGION': {
      // 이미 판정 대기 중이거나, 이미 점령된 칸이면 무시한다.
      if (state.pendingRegionId) return state;
      if (state.regionOwners[action.regionId] !== null) return state;

      const region = state.config.regions.find((candidate) => candidate.id === action.regionId);
      const eligibleQuestions = region ? findEligibleQuestions(state.config.questions, region) : [];

      if (eligibleQuestions.length === 0) {
        // 이 지역 이름으로 태깅된 문제가 없다 — 다른 문제로 대체하지 않고 선택을 막는다.
        return { ...state, blockedRegionId: action.regionId };
      }

      const question = pickRandomQuestion(eligibleQuestions);
      return {
        ...state,
        pendingRegionId: action.regionId,
        currentQuestion: question,
        blockedRegionId: null,
        lastResult: null
      };
    }

    case 'JUDGE_ANSWER': {
      if (!state.pendingRegionId || !state.currentQuestion) return state;

      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const participantId = action.answer.participantId;

      const regionOwners = { ...state.regionOwners };
      if (correct) {
        regionOwners[state.pendingRegionId] = participantId;
      }

      const nextTeamIndex = (state.currentTeamIndex + 1) % state.config.teams.length;
      const finished = allRegionsOwned(regionOwners);
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];

      return {
        ...state,
        regionOwners,
        currentTeamIndex: nextTeamIndex,
        pendingRegionId: null,
        currentQuestion: null,
        status: finished ? 'finished' : 'inProgress',
        lastResult: { regionId: state.pendingRegionId, teamId: participantId, correct, answerText },
        answerHistory
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'REASSIGN_REGION': {
      // 교사 수동 개입: 잘못 배정된 칸의 소유팀을 바로잡는다(다른 팀으로, 또는 미점령으로).
      return {
        ...state,
        regionOwners: { ...state.regionOwners, [action.regionId]: action.newOwnerTeamId }
      };
    }

    default:
      return state;
  }
}

export function useTerritoryEngine(config: TerritoryConfig) {
  const [state, dispatch] = useReducer(territoryReducer, config, createInitialState);

  function selectRegion(regionId: string): void {
    dispatch({ type: 'SELECT_REGION', regionId });
  }

  function judgeAnswer(value: unknown): void {
    const currentTeam = state.config.teams[state.currentTeamIndex];
    dispatch({ type: 'JUDGE_ANSWER', answer: { participantId: currentTeam.id, value, submittedAt: Date.now() } });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function reassignRegion(regionId: string, newOwnerTeamId: string | null): void {
    dispatch({ type: 'REASSIGN_REGION', regionId, newOwnerTeamId });
  }

  return { state, selectRegion, judgeAnswer, endGame, reassignRegion };
}
