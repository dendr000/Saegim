import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useTimeAttackEngine } from '../timeAttack/useTimeAttackEngine';
import HotSeatInitialsControls from './HotSeatInitialsControls';
import SimultaneousInitialsControls from './SimultaneousInitialsControls';
import type { InitialLetterConfig } from './types';

type InitialLetterPlayProps = {
  config: InitialLetterConfig;
  onFinish: (result: GameFinishPayload) => void;
};

// 초성 퀴즈는 타임어택과 엔진이 완전히 동일하다(점수 계산·턴 진행·시간 제한) — 다른 건
// 문제 프롬프트로 초성을 보여준다는 것뿐이라, useTimeAttackEngine을 그대로 재사용한다.
function InitialLetterPlay({ config, onFinish }: InitialLetterPlayProps) {
  const {
    state,
    remainingSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitAnswer,
    skipQuestion,
    endRound,
    adjustScore
  } = useTimeAttackEngine(config);

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
        <h1 className="stage-title">초성 퀴즈</h1>
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
          <HotSeatInitialsControls
            question={state.currentQuestion}
            activeParticipantLabel={activeParticipant.label}
            onSubmit={(value) => submitAnswer(value, activeParticipant.id)}
            onEndTurn={endRound}
          />
        ) : (
          <SimultaneousInitialsControls
            // 문제가 바뀔 때마다 검색어/선택된 학생을 초기화한다.
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            participants={state.participants}
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

export default InitialLetterPlay;
