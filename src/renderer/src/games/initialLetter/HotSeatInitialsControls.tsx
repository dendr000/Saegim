import type { Question } from '../../../../shared/types/question';
import { extractInitials } from './initials';

type HotSeatInitialsControlsProps = {
  question: Question;
  activeParticipantLabel: string;
  onSubmit: (value: unknown) => void;
  onEndTurn: () => void;
};

function HotSeatInitialsControls({
  question,
  activeParticipantLabel,
  onSubmit,
  onEndTurn
}: HotSeatInitialsControlsProps) {
  if (question.type !== 'shortAnswer') {
    return <p className="stage-text">이 유형은 초성 퀴즈에서 지원하지 않습니다.</p>;
  }

  return (
    <div>
      <h3 className="stage-subtitle">
        지금 차례: {activeParticipantLabel}{' '}
        <button type="button" className="stage-button stage-button-small" onClick={onEndTurn}>
          다음 학생으로 →
        </button>
      </h3>
      <p className="stage-text stage-muted">
        {question.era} / {question.unit}
      </p>
      <p className="stage-question">{extractInitials(question.payload.answer)}</p>

      <p className="stage-text">
        정답: <strong>{question.payload.answer}</strong>
        {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
          ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
          : ''}
      </p>
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

export default HotSeatInitialsControls;
