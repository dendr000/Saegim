import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useGoldenBellEngine } from './useGoldenBellEngine';
import GoldenBellChecklist from './GoldenBellChecklist';
import type { GoldenBellConfig } from './types';

type GoldenBellPlayProps = {
  config: GoldenBellConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function GoldenBellPlay({ config, onFinish }: GoldenBellPlayProps) {
  const { state, submitJudgment, forceNextRound, grantRevival, reviveManually, endGame, adjustScore } =
    useGoldenBellEngine(config);

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish({
        scores: state.participants.map((participant) => ({
          id: participant.id,
          label: participant.label,
          score: participant.score
        })),
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

  const aliveCount = state.participants.filter((participant) => participant.status === 'alive').length;
  const eliminatedCount = state.participants.length - aliveCount;
  const lastResultLabel = state.lastResult
    ? state.participants.find((participant) => participant.id === state.lastResult!.participantId)?.label
    : undefined;

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">골든벨 서바이벌</h1>
        <p className="stage-subtitle">
          생존자 {aliveCount}명 / 탈락자 {eliminatedCount}명
        </p>

        {state.lastResult && (
          <>
            <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
            {state.lastResult.eliminated && (
              <p className="stage-text">{lastResultLabel} 탈락했습니다.</p>
            )}
            {state.lastResult.revivalUsed && (
              <p className="stage-text">{lastResultLabel}, 부활권으로 탈락을 면했습니다.</p>
            )}
          </>
        )}

        {state.currentQuestion && (
          <GoldenBellChecklist
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            participants={state.participants}
            judgedThisRound={state.judgedThisRound}
            onJudge={submitJudgment}
            onGrantRevival={grantRevival}
            onReviveManually={reviveManually}
          />
        )}

        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="stage-button stage-button-small" onClick={forceNextRound}>
            다음 라운드로 강제 진행
          </button>{' '}
          <button type="button" className="stage-button stage-button-small" onClick={endGame}>
            게임 종료
          </button>
        </div>

        <h3 className="stage-subtitle">점수판</h3>
        <Scoreboard
          entries={state.participants.map((participant) => ({
            id: participant.id,
            label: participant.label,
            score: participant.score
          }))}
          onAdjustScore={adjustScore}
        />
      </div>
    </div>
  );
}

export default GoldenBellPlay;
