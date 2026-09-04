import type { Question } from '../../../../shared/types/question';
import AnswerConfirm from '../_shared/AnswerConfirm';

type HotSeatControlsProps = {
  question: Question;
  activeParticipantLabel: string;
  onSubmit: (value: unknown) => void;
  onEndTurn: () => void;
};

function HotSeatControls({ question, activeParticipantLabel, onSubmit, onEndTurn }: HotSeatControlsProps) {
  return (
    <div>
      <h3 className="stage-subtitle">
        지금 차례: {activeParticipantLabel}{' '}
        <button type="button" className="stage-button stage-button-small" onClick={onEndTurn}>
          다음 학생으로 →
        </button>
      </h3>
      <p className="stage-question">{question.payload.question}</p>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button key={index} type="button" className="stage-button" onClick={() => onSubmit({ choiceIndex: index })}>
              {choice}
            </button>
          ))}
        </div>
      ) : question.type === 'shortAnswer' ? (
        <div>
          <AnswerConfirm key={question.id}>
            <p className="stage-text">
              정답: <strong>{question.payload.answer}</strong>
              {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
                ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
                : ''}
            </p>
          </AnswerConfirm>
          <p className="stage-text">학생이 말한 답이 위 정답과 같나요?</p>
          <button type="button" className="stage-button stage-button-primary" onClick={() => onSubmit({ judgedCorrect: true })}>
            정답 처리
          </button>
          <button type="button" className="stage-button" onClick={() => onSubmit({ judgedCorrect: false })}>
            오답 처리
          </button>
        </div>
      ) : (
        <p className="stage-text">이 유형은 아직 타임어택에서 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default HotSeatControls;
