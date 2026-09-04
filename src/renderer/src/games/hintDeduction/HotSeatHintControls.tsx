import type { Question } from '../../../../shared/types/question';
import AnswerConfirm from '../_shared/AnswerConfirm';
import { maxHintsFor, revealHintText } from './hints';
import { HINT_PENALTY_RATIO } from './scoring';

type HotSeatHintControlsProps = {
  question: Question;
  activeParticipantLabel: string;
  hintsRevealed: number;
  onRevealHint: () => void;
  onSubmit: (value: unknown) => void;
  onEndTurn: () => void;
};

function HotSeatHintControls({
  question,
  activeParticipantLabel,
  hintsRevealed,
  onRevealHint,
  onSubmit,
  onEndTurn
}: HotSeatHintControlsProps) {
  if (question.type !== 'shortAnswer') {
    return <p className="stage-text">이 유형은 힌트 차감형에서 지원하지 않습니다.</p>;
  }

  const maxHints = maxHintsFor(question.payload.answer);
  const hintExhausted = hintsRevealed >= maxHints;
  const deductionPercent = Math.round(Math.min(1, hintsRevealed * HINT_PENALTY_RATIO) * 100);

  return (
    <div>
      <h3 className="stage-subtitle">
        지금 차례: {activeParticipantLabel}{' '}
        <button type="button" className="stage-button stage-button-small" onClick={onEndTurn}>
          다음 학생으로 →
        </button>
      </h3>
      <p className="stage-question">{question.payload.question}</p>

      {hintsRevealed > 0 && (
        <p className="stage-question" style={{ fontSize: '1.5rem' }}>
          {revealHintText(question.payload.answer, hintsRevealed)}
        </p>
      )}

      <div className="button-row">
        <button type="button" className="stage-button" onClick={onRevealHint} disabled={hintExhausted}>
          힌트 보기 ({hintsRevealed}/{maxHints}회 사용)
        </button>
        <span className="stage-text stage-muted">
          {hintsRevealed > 0 ? `지금 정답 처리 시 점수 -${deductionPercent}%` : '아직 힌트를 쓰지 않았습니다'}
        </span>
      </div>

      <AnswerConfirm key={question.id}>
        <p className="stage-text">
          정답: <strong>{question.payload.answer}</strong>
          {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
            ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
            : ''}
        </p>
      </AnswerConfirm>
      <p className="stage-text">학생이 말한 답이 위 정답과 같나요?</p>
      <button
        type="button"
        className="stage-button stage-button-primary"
        onClick={() => onSubmit({ judgedCorrect: true })}
      >
        정답 처리
      </button>
      <button type="button" className="stage-button" onClick={() => onSubmit({ judgedCorrect: false })}>
        오답 처리
      </button>
    </div>
  );
}

export default HotSeatHintControls;
