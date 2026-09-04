import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { ParticipantScore } from '../_shared/types';
import { useTimeAttackEngine } from './useTimeAttackEngine';
import HotSeatControls from './HotSeatControls';
import SimultaneousControls from './SimultaneousControls';
import type { TimeAttackConfig } from './types';

type TimeAttackPlayProps = {
  config: TimeAttackConfig;
  onFinish: (scores: ParticipantScore[]) => void;
};

function TimeAttackPlay({ config, onFinish }: TimeAttackPlayProps) {
  const { state, remainingSeconds, submitAnswer, skipQuestion, endRound } = useTimeAttackEngine(config);

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish(state.participants.map((participant) => ({ id: participant.id, label: participant.label, score: participant.score })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastResult) return;
    if (state.lastResult.correct) playCorrectSound();
    else playWrongSound();
  }, [state.lastResult]);

  if (state.status === 'finished') {
    return <p>결과 화면으로 이동 중...</p>;
  }

  const activeParticipant = state.participants.find((participant) => participant.id === state.activeParticipantId);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>타임어택 콤보</h1>
      <p style={{ fontSize: '2rem' }}>남은 시간: {remainingSeconds}초</p>

      {state.lastResult && (
        <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
      )}

      {config.mode === 'hotSeat' && activeParticipant ? (
        <HotSeatControls
          question={state.currentQuestion}
          activeParticipantLabel={activeParticipant.label}
          onSubmit={(value) => submitAnswer(value, activeParticipant.id)}
          onEndTurn={endRound}
        />
      ) : (
        <SimultaneousControls
          // 문제가 바뀔 때마다 검색어/선택된 학생을 초기화한다.
          key={state.currentQuestion.id}
          question={state.currentQuestion}
          participants={state.participants}
          onSubmit={(participantId, value) => submitAnswer(value, participantId)}
          onSkip={skipQuestion}
          onEndSession={endRound}
        />
      )}

      <h3>점수판</h3>
      <Scoreboard
        entries={state.participants.map((participant) => ({
          id: participant.id,
          label: participant.label,
          score: participant.score
        }))}
      />
    </div>
  );
}

export default TimeAttackPlay;
