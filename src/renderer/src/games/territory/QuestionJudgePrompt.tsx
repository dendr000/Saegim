import type { Question } from '../../../../shared/types/question';

type QuestionJudgePromptProps = {
  question: Question;
  onJudge: (value: unknown) => void;
};

function QuestionJudgePrompt({ question, onJudge }: QuestionJudgePromptProps) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '0.5rem' }}>
      <p style={{ fontSize: '1.5rem' }}>{question.payload.question}</p>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onJudge({ choiceIndex: index })}
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
          <p>팀이 말한 답이 위 정답과 같나요?</p>
          <button
            type="button"
            onClick={() => onJudge({ judgedCorrect: true })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            정답 처리
          </button>
          <button
            type="button"
            onClick={() => onJudge({ judgedCorrect: false })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            오답 처리
          </button>
        </div>
      ) : (
        <p>이 유형은 아직 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default QuestionJudgePrompt;
