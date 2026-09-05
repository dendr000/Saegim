import { useEffect } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useCardMatchingEngine } from './useCardMatchingEngine';
import CardGrid from './CardGrid';
import type { CardMatchingConfig } from './types';

type CardMatchingPlayProps = {
  config: CardMatchingConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function CardMatchingPlay({ config, onFinish }: CardMatchingPlayProps) {
  const { state, flipCard, endGame, adjustScore } = useCardMatchingEngine(config);

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
  const totalPairs = state.cards.length / 2;

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">카드 매칭</h1>
        <p className="stage-timer">
          찾은 짝: {state.matchedQuestionIds.size} / {totalPairs}
        </p>

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {activeParticipant && <h3 className="stage-subtitle">지금 차례: {activeParticipant.label}</h3>}

        <CardGrid
          cards={state.cards}
          flippedCardIds={state.flippedCardIds}
          matchedQuestionIds={state.matchedQuestionIds}
          disabled={state.pendingMismatch}
          onFlip={flipCard}
        />

        <div style={{ marginTop: '1rem' }}>
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

export default CardMatchingPlay;
