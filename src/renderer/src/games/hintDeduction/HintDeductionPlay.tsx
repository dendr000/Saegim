import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useHintDeductionEngine } from './useHintDeductionEngine';
import HotSeatHintControls from './HotSeatHintControls';
import SimultaneousHintControls from './SimultaneousHintControls';
import type { HintDeductionConfig } from './types';

type HintDeductionPlayProps = {
  config: HintDeductionConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function HintDeductionPlay({ config, onFinish }: HintDeductionPlayProps) {
  const {
    state,
    remainingSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitAnswer,
    revealHint,
    skipQuestion,
    endRound,
    adjustScore
  } = useHintDeductionEngine(config);

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
        <h1 className="stage-title">힌트 차감형</h1>
        <p className="stage-timer">남은 시간: {remainingSeconds}초</p>
        <TimerControls
          isRunning={isTimerRunning}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onReset={resetTimer}
        />

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {config.mode === 'hotSeat' && activeParticipant ? (
          <HotSeatHintControls
            question={state.currentQuestion}
            activeParticipantLabel={activeParticipant.label}
            hintsRevealed={state.hintsRevealed}
            onRevealHint={revealHint}
            onSubmit={(value) => submitAnswer(value, activeParticipant.id)}
            onEndTurn={endRound}
          />
        ) : (
          <SimultaneousHintControls
            // 문제가 바뀔 때마다 검색어/선택된 학생을 초기화한다.
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            participants={state.participants}
            hintsRevealed={state.hintsRevealed}
            onRevealHint={revealHint}
            onSubmit={(participantId, value) => submitAnswer(value, participantId)}
            onSkip={skipQuestion}
            onEndSession={endRound}
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

export default HintDeductionPlay;
