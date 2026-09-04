import type { Question } from '../../../../shared/types/question';

type HotSeatControlsProps = {
  question: Question;
  activeParticipantLabel: string;
  onSubmit: (value: unknown) => void;
  onEndTurn: () => void;
};

function HotSeatControls({ question, activeParticipantLabel, onSubmit, onEndTurn }: HotSeatControlsProps) {
  return (
    <div>
      <h3>
        지금 차례: {activeParticipantLabel}{' '}
        <button type="button" onClick={onEndTurn} style={{ fontSize: '0.9rem' }}>
          다음 학생으로 →
        </button>
      </h3>
      <p style={{ fontSize: '1.5rem' }}>{question.payload.question}</p>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSubmit({ choiceIndex: index })}
              style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : question.type === 'shortAnswer' ? (
        <div>
          <p>
            정답: <strong>{question.payload.answer}</strong>
            {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
              ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
              : ''}
          </p>
          <p>학생이 말한 답이 위 정답과 같나요?</p>
          <button
            type="button"
            onClick={() => onSubmit({ judgedCorrect: true })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            정답 처리
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ judgedCorrect: false })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            오답 처리
          </button>
        </div>
      ) : (
        <p>이 유형은 아직 타임어택에서 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default HotSeatControls;
