import { useEffect, useState } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useMosaicRevealEngine } from './useMosaicRevealEngine';
import MosaicRevealControls from './MosaicRevealControls';
import type { MosaicRevealConfig } from './types';

const MAX_BLUR_PX = 24;

type MosaicRevealPlayProps = {
  config: MosaicRevealConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function MosaicRevealPlay({ config, onFinish }: MosaicRevealPlayProps) {
  const {
    state,
    remainingSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitAnswer,
    skipQuestion,
    endGame,
    adjustScore
  } = useMosaicRevealEngine(config);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.currentQuestion?.type !== 'imageIdentify') {
      setImageDataUrl(null);
      return;
    }
    let cancelled = false;
    window.images.get(state.currentQuestion.payload.imageFileName).then((dataUrl) => {
      if (!cancelled) setImageDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [state.currentQuestion]);

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

  const blurPx = Math.max(0, MAX_BLUR_PX * (remainingSeconds / config.revealSeconds));

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">모자이크 공개</h1>
        <p className="stage-timer">남은 시간: {remainingSeconds}초</p>
        <TimerControls isRunning={isTimerRunning} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} />

        {imageDataUrl && (
          <div style={{ margin: '1rem 0' }}>
            <img
              src={imageDataUrl}
              alt="맞혀야 할 이미지"
              style={{ maxWidth: '480px', maxHeight: '360px', filter: `blur(${blurPx}px)` }}
            />
          </div>
        )}

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {state.currentQuestion && (
          <MosaicRevealControls
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            participants={state.participants}
            onSubmit={submitAnswer}
            onSkip={skipQuestion}
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

export default MosaicRevealPlay;
