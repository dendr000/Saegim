import { useState, type FormEvent } from 'react';
import type { Question, QuestionDraft, SupportedQuestionType } from '../../../../shared/types/question';
import { QUESTION_TYPE_LABELS } from '../../../../shared/questionCsv';

type QuestionFormProps = {
  initial?: Question;
  onSubmit: (draft: QuestionDraft) => void;
  onCancel: () => void;
};

const EMPTY_CHOICES = ['', '', '', ''];

function QuestionForm({ initial, onSubmit, onCancel }: QuestionFormProps) {
  const [type, setType] = useState<SupportedQuestionType>(
    initial?.type === 'shortAnswer' ? 'shortAnswer' : 'multipleChoice'
  );
  const [era, setEra] = useState(initial?.era ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(initial?.difficulty ?? 1);
  const [question, setQuestion] = useState(initial?.payload.question ?? '');

  const [choices, setChoices] = useState<string[]>(
    initial?.type === 'multipleChoice' ? padChoices(initial.payload.choices) : EMPTY_CHOICES
  );
  const [answerIndex, setAnswerIndex] = useState<number>(
    initial?.type === 'multipleChoice' ? initial.payload.answerIndex : 0
  );

  const [answer, setAnswer] = useState(initial?.type === 'shortAnswer' ? initial.payload.answer : '');
  const [acceptableAnswersText, setAcceptableAnswersText] = useState(
    initial?.type === 'shortAnswer' ? (initial.payload.acceptableAnswers ?? []).join(', ') : ''
  );

  const [error, setError] = useState<string | null>(null);

  function padChoices(source: string[]): string[] {
    const next = [...source];
    while (next.length < 4) next.push('');
    return next.slice(0, 4);
  }

  function handleChoiceChange(index: number, value: string): void {
    const next = [...choices];
    next[index] = value;
    setChoices(next);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setError(null);

    if (!era.trim()) return setError('시대를 입력하세요.');
    if (!unit.trim()) return setError('단원을 입력하세요.');
    if (!question.trim()) return setError('질문을 입력하세요.');

    if (type === 'multipleChoice') {
      const filledChoices = choices.map((choice) => choice.trim()).filter((choice) => choice.length > 0);
      if (filledChoices.length < 2) return setError('보기를 2개 이상 입력하세요.');

      const answerText = choices[answerIndex]?.trim();
      if (!answerText) return setError('정답으로 표시된 보기가 비어있습니다.');

      const finalAnswerIndex = filledChoices.indexOf(answerText);

      onSubmit({
        era: era.trim(),
        unit: unit.trim(),
        difficulty,
        type: 'multipleChoice',
        payload: { question: question.trim(), choices: filledChoices, answerIndex: finalAnswerIndex }
      });
      return;
    }

    if (!answer.trim()) return setError('정답을 입력하세요.');
    const acceptableAnswers = acceptableAnswersText
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    onSubmit({
      era: era.trim(),
      unit: unit.trim(),
      difficulty,
      type: 'shortAnswer',
      payload: {
        question: question.trim(),
        answer: answer.trim(),
        ...(acceptableAnswers.length > 0 ? { acceptableAnswers } : {})
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <h3>{initial ? '문항 수정' : '문항 추가'}</h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          유형:{' '}
          <select
            value={type}
            onChange={(event) => setType(event.target.value as SupportedQuestionType)}
            disabled={Boolean(initial)}
          >
            {(Object.keys(QUESTION_TYPE_LABELS) as SupportedQuestionType[]).map((key) => (
              <option key={key} value={key}>
                {QUESTION_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <label>
          시대: <input value={era} onChange={(event) => setEra(event.target.value)} />
        </label>
        <label>
          단원: <input value={unit} onChange={(event) => setUnit(event.target.value)} />
        </label>
        <label>
          난이도:{' '}
          <select value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value) as 1 | 2 | 3)}>
            <option value={1}>1 (쉬움)</option>
            <option value={2}>2 (보통)</option>
            <option value={3}>3 (어려움)</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block' }}>질문:</label>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={2}
          style={{ width: '100%' }}
        />
      </div>

      {type === 'multipleChoice' ? (
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block' }}>보기 (정답 라디오로 표시):</label>
          {choices.map((choice, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <input
                type="radio"
                name="answerIndex"
                checked={answerIndex === index}
                onChange={() => setAnswerIndex(index)}
              />
              <input
                value={choice}
                onChange={(event) => handleChoiceChange(index, event.target.value)}
                placeholder={`보기 ${index + 1}`}
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block' }}>
            정답: <input value={answer} onChange={(event) => setAnswer(event.target.value)} />
          </label>
          <label style={{ display: 'block' }}>
            추가 허용 답안 (쉼표로 구분, 선택):{' '}
            <input
              value={acceptableAnswersText}
              onChange={(event) => setAcceptableAnswersText(event.target.value)}
              style={{ width: '60%' }}
            />
          </label>
        </div>
      )}

      <button type="submit">{initial ? '수정 저장' : '추가'}</button>{' '}
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  );
}

export default QuestionForm;
