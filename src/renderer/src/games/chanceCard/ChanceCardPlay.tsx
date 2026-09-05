import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import QuestionJudgePrompt from '../territory/QuestionJudgePrompt';
import { useChanceCardEngine } from './useChanceCardEngine';
import type { ChanceCardConfig } from './types';

type ChanceCardPlayProps = {
  config: ChanceCardConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function ChanceCardPlay({ config, onFinish }: ChanceCardPlayProps) {
  const { state, judgeAnswer, resolveSteal, endGame, adjustScore } = useChanceCardEngine(config);

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish({
        scores: state.teams.map((team) => ({ id: team.id, label: team.label, score: team.score })),
        answers: state.answerHistory
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastResult) return;
    if (state.lastResult.correct) playCorrectSound();
    else playWrongSound();
  }, [state.lastResult]);

  if (state.status === 'finished') {
    return (
      <div className="stage">
        <p className="stage-text">결과 화면으로 이동 중...</p>
      </div>
    );
  }

  const activeTeam = state.teams.find((team) => team.id === state.activeTeamId);
  const drawerTeam = state.lastResult ? state.teams.find((team) => team.id === state.lastResult!.teamId) : undefined;

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">찬스카드</h1>

        <p className="stage-subtitle">
          팀 상태:{' '}
          {state.teams.map((team) => `${team.label} ${team.score}점${team.hasShield ? '(방어막)' : ''}`).join(' · ')}
        </p>

        {state.lastCardEvent && <p className="stage-text">{state.lastCardEvent}</p>}

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {state.pendingCard === 'steal' && drawerTeam ? (
          <div className="stage-panel">
            <p className="stage-text">
              {drawerTeam.label}이(가) 점수 훔치기 카드를 뽑았습니다! 어느 팀에게서 훔칠까요?
            </p>
            {state.teams
              .filter((team) => team.id !== drawerTeam.id)
              .map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className="stage-button"
                  onClick={() => resolveSteal(team.id)}
                >
                  {team.label} ({team.score}점{team.hasShield ? ', 방어막 보유' : ''})
                </button>
              ))}
          </div>
        ) : (
          state.currentQuestion &&
          activeTeam && (
            <div key={state.currentQuestion.id}>
              <h3 className="stage-subtitle">지금 차례: {activeTeam.label}</h3>
              <QuestionJudgePrompt question={state.currentQuestion} onJudge={judgeAnswer} />
            </div>
          )
        )}

        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="stage-button stage-button-small" onClick={endGame}>
            게임 종료
          </button>
        </div>

        <h3 className="stage-subtitle">점수판</h3>
        <Scoreboard
          entries={state.teams.map((team) => ({ id: team.id, label: team.label, score: team.score }))}
          onAdjustScore={adjustScore}
        />
      </div>
    </div>
  );
}

export default ChanceCardPlay;
