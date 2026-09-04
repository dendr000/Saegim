import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { findEligibleQuestions } from './regionQuestionMatch';
import type { TerritoryConfig, TerritoryState } from './types';

type Action =
  | { type: 'SELECT_REGION'; regionId: string }
  | { type: 'JUDGE_ANSWER'; value: unknown }
  | { type: 'END_GAME_MANUALLY' };

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
    lastResult: null
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

      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.value);
      const currentTeam = state.config.teams[state.currentTeamIndex];

      const regionOwners = { ...state.regionOwners };
      if (correct) {
        regionOwners[state.pendingRegionId] = currentTeam.id;
      }

      const nextTeamIndex = (state.currentTeamIndex + 1) % state.config.teams.length;
      const finished = allRegionsOwned(regionOwners);

      return {
        ...state,
        regionOwners,
        currentTeamIndex: nextTeamIndex,
        pendingRegionId: null,
        currentQuestion: null,
        status: finished ? 'finished' : 'inProgress',
        lastResult: { regionId: state.pendingRegionId, teamId: currentTeam.id, correct, answerText }
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
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
    dispatch({ type: 'JUDGE_ANSWER', value });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  return { state, selectRegion, judgeAnswer, endGame };
}
