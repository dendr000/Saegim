import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useBombPassEngine } from './useBombPassEngine';
import BombPassControls from './BombPassControls';
import type { BombPassConfig } from './types';

type BombPassPlayProps = {
  config: BombPassConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function BombPassPlay({ config, onFinish }: BombPassPlayProps) {
  const {
    state,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitAnswer,
    passManually,
    endGame,
    adjustScore
  } = useBombPassEngine(config);

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

  const activeParticipant = state.participants.find((participant) => participant.id === state.activeParticipantId);

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">폭탄 돌리기</h1>
        {/* 언제 터질지 모르는 게 이 게임의 핵심이라 남은 시간 숫자는 일부러 보여주지 않는다. */}
        <p className="stage-timer">폭탄이 돌아가는 중입니다...</p>
        <TimerControls isRunning={isTimerRunning} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} />

        {state.lastExplosion && (
          <p className="stage-subtitle">
            마지막으로 터진 사람: {state.lastExplosion.label} (−{config.bombPenalty}점)
          </p>
        )}

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {state.currentQuestion && activeParticipant && (
          <BombPassControls
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            activeParticipantLabel={activeParticipant.label}
            onSubmit={submitAnswer}
            onPassManually={passManually}
            onEndGame={endGame}
          />
        )}

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

export default BombPassPlay;
