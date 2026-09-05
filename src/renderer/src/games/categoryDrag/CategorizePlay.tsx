import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useCategorizeEngine } from './useCategorizeEngine';
import CategoryDropZone from './CategoryDropZone';
import type { CategorizeConfig } from './types';

const UNPLACED = -1;

type CategorizePlayProps = {
  config: CategorizeConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function CategorizePlay({ config, onFinish }: CategorizePlayProps) {
  const {
    state,
    remainingSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    placeItem,
    submitPlacements,
    endGame,
    adjustScore
  } = useCategorizeEngine(config);

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
    if (!state.lastRoundResult) return;
    if (state.lastRoundResult.correctCount === state.lastRoundResult.totalCount) playCorrectSound();
    else playWrongSound();
  }, [state.lastRoundResult]);

  if (state.status === 'finished') {
    return (
      <div className="stage">
        <p className="stage-text">결과 화면으로 이동 중...</p>
      </div>
    );
  }

  const question = state.currentQuestion;
  const activeParticipant = state.participants.find((participant) => participant.id === state.activeParticipantId);

  if (!question || question.type !== 'categorize' || !activeParticipant) {
    return (
      <div className="stage">
        <p className="stage-text">문제를 불러오는 중...</p>
      </div>
    );
  }

  const unplacedItems = question.payload.items.filter(
    (item) => (state.currentPlacements[item.id] ?? UNPLACED) === UNPLACED
  );

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">분류 드래그</h1>
        <p className="stage-timer">남은 시간: {remainingSeconds}초</p>
        <TimerControls isRunning={isTimerRunning} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} />

        {state.lastRoundResult && (
          <p className="stage-text">
            {state.lastRoundResult.label}: {state.lastRoundResult.correctCount} / {state.lastRoundResult.totalCount}개
            정답
          </p>
        )}

        <h3 className="stage-subtitle">지금 차례: {activeParticipant.label}</h3>
        <p className="stage-question">{question.payload.question}</p>

        <CategoryDropZone label="미배치" items={unplacedItems} onDropItem={(itemId) => placeItem(itemId, UNPLACED)} />

        <div>
          {question.payload.categories.map((category, categoryIndex) => (
            <CategoryDropZone
              key={categoryIndex}
              label={category}
              items={question.payload.items.filter((item) => state.currentPlacements[item.id] === categoryIndex)}
              onDropItem={(itemId) => placeItem(itemId, categoryIndex)}
            />
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="stage-button stage-button-primary" onClick={submitPlacements}>
            제출
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

export default CategorizePlay;
