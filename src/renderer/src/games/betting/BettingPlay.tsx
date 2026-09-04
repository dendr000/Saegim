import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerConfirm from '../_shared/AnswerConfirm';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useBettingEngine } from './useBettingEngine';
import BetInputRow from './BetInputRow';
import TeamAnswerRow from './TeamAnswerRow';
import type { BettingConfig } from './types';

type BettingPlayProps = {
  config: BettingConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function BettingPlay({ config, onFinish }: BettingPlayProps) {
  const { state, setBet, lockInBets, setTeamAnswer, settleRound, endGame, adjustScore } = useBettingEngine(config);

  useEffect(() => {
    if (state.status !== 'finished') return;
    onFinish({
      scores: state.teams.map((team) => ({ id: team.id, label: team.label, score: team.score })),
      answers: state.answerHistory
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastRoundResults) return;
    const anyCorrect = state.lastRoundResults.some((result) => result.correct);
    if (anyCorrect) playCorrectSound();
    else playWrongSound();
  }, [state.lastRoundResults]);

  if (state.status === 'finished') {
    return (
      <div className="stage">
        <p className="stage-text">결과 화면으로 이동 중...</p>
      </div>
    );
  }

  const isLastRound = state.roundIndex === state.config.totalRounds - 1;
  const allAnswered = state.teams.every((team) => team.id in state.answers);

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">베팅형</h1>
        <p className="stage-subtitle">
          라운드 {state.roundIndex + 1} / {state.config.totalRounds}
          {isLastRound && <strong style={{ color: 'var(--color-wrong)' }}> — 마지막 문제!</strong>}
        </p>

        {state.lastRoundResults && (
          <div className="stage-panel">
            <strong className="stage-text">지난 라운드 결과</strong>
            <ul className="stage-text">
              {state.lastRoundResults.map((result) => {
                const team = state.teams.find((candidate) => candidate.id === result.teamId);
                return (
                  <li key={result.teamId}>
                    {team?.label}: {result.correct ? '정답' : '오답'} ({result.delta >= 0 ? '+' : ''}
                    {result.delta}점)
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <h3 className="stage-subtitle">점수판</h3>
        <Scoreboard
          entries={state.teams.map((team) => ({ id: team.id, label: team.label, score: team.score }))}
          onAdjustScore={adjustScore}
        />

        {state.phase === 'betting' ? (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 className="stage-subtitle">배팅</h3>
            {state.teams.map((team) => (
              <BetInputRow key={team.id} team={team} bet={state.bets[team.id] ?? 0} onChange={(amount) => setBet(team.id, amount)} />
            ))}
            <button type="button" className="stage-button stage-button-primary" onClick={lockInBets} style={{ marginTop: '0.5rem' }}>
              문제 공개
            </button>
          </div>
        ) : (
          state.currentQuestion && (
            <div style={{ marginTop: '1.5rem' }}>
              <p className="stage-question">{state.currentQuestion.payload.question}</p>
              {state.currentQuestion.type === 'shortAnswer' && (
                <AnswerConfirm key={state.currentQuestion.id}>
                  <p className="stage-text">
                    정답: <strong>{state.currentQuestion.payload.answer}</strong>
                    {state.currentQuestion.payload.acceptableAnswers &&
                    state.currentQuestion.payload.acceptableAnswers.length > 0
                      ? ` (${state.currentQuestion.payload.acceptableAnswers.join(', ')}도 정답)`
                      : ''}
                  </p>
                </AnswerConfirm>
              )}

              <h3 className="stage-subtitle">팀별 답</h3>
              {state.teams.map((team) => (
                <TeamAnswerRow
                  key={team.id}
                  team={team}
                  bet={state.bets[team.id] ?? 0}
                  question={state.currentQuestion!}
                  selectedValue={state.answers[team.id]}
                  onSelect={(value) => setTeamAnswer(team.id, value)}
                />
              ))}

              <button
                type="button"
                className="stage-button stage-button-primary"
                onClick={settleRound}
                disabled={!allAnswered}
                style={{ marginTop: '0.5rem' }}
              >
                정산하기
              </button>
            </div>
          )
        )}

        <button type="button" className="stage-button" onClick={endGame} style={{ marginTop: '1.5rem' }}>
          게임 종료
        </button>
      </div>
    </div>
  );
}

export default BettingPlay;
