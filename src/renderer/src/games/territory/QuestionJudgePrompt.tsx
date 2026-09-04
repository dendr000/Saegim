import type { Question } from '../../../../shared/types/question';

type QuestionJudgePromptProps = {
  question: Question;
  onJudge: (value: unknown) => void;
};

function QuestionJudgePrompt({ question, onJudge }: QuestionJudgePromptProps) {
  return (
    <div className="stage-panel">
      <p className="stage-question">{question.payload.question}</p>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button key={index} type="button" className="stage-button" onClick={() => onJudge({ choiceIndex: index })}>
              {choice}
            </button>
          ))}
        </div>
      ) : question.type === 'shortAnswer' ? (
        <div>
          <p className="stage-text">
            정답: <strong>{question.payload.answer}</strong>
            {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
              ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
              : ''}
          </p>
          <p className="stage-text">팀이 말한 답이 위 정답과 같나요?</p>
          <button type="button" className="stage-button stage-button-primary" onClick={() => onJudge({ judgedCorrect: true })}>
            정답 처리
          </button>
          <button type="button" className="stage-button" onClick={() => onJudge({ judgedCorrect: false })}>
            오답 처리
          </button>
        </div>
      ) : (
        <p className="stage-text">이 유형은 아직 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default QuestionJudgePrompt;
