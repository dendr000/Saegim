import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
    initial?.type === 'shortAnswer' || initial?.type === 'imageIdentify' ? initial.type : 'multipleChoice'
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

  const [answer, setAnswer] = useState(
    initial?.type === 'shortAnswer' || initial?.type === 'imageIdentify' ? initial.payload.answer : ''
  );
  const [acceptableAnswersText, setAcceptableAnswersText] = useState(
    initial?.type === 'shortAnswer' ? (initial.payload.acceptableAnswers ?? []).join(', ') : ''
  );

  const [imageFileName] = useState(initial?.type === 'imageIdentify' ? initial.payload.imageFileName : '');
  // 새로 고른 파일의 data URL — 실제 업로드는 제출 시점에 한다(고르기만 하고 취소할 수도 있어서).
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState<string | null>(null);
  const [pendingImageOriginalName, setPendingImageOriginalName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.type === 'imageIdentify') {
      window.images
        .get(initial.payload.imageFileName)
        .then(setImagePreviewUrl)
        .catch(() => setImagePreviewUrl(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingImageDataUrl(dataUrl);
      setPendingImageOriginalName(file.name);
      setImagePreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

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

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!era.trim()) return setError('시대를 입력하세요.');
    if (!unit.trim()) return setError('단원을 입력하세요.');
    if (!question.trim()) return setError('질문을 입력하세요.');

    if (type === 'imageIdentify') {
      if (!answer.trim()) return setError('정답을 입력하세요.');
      if (!pendingImageDataUrl && !imageFileName) return setError('이미지를 선택하세요.');

      setIsSubmitting(true);
      try {
        const finalImageFileName = pendingImageDataUrl
          ? await window.images.upload(pendingImageOriginalName, pendingImageDataUrl)
          : imageFileName;

        onSubmit({
          era: era.trim(),
          unit: unit.trim(),
          difficulty,
          type: 'imageIdentify',
          payload: { imageFileName: finalImageFileName, question: question.trim(), answer: answer.trim() }
        });
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
    <form onSubmit={handleSubmit} className="panel">
      <h3>{initial ? '문항 수정' : '문항 추가'}</h3>

      {error && <p className="error-text">{error}</p>}

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
      ) : type === 'imageIdentify' ? (
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block' }}>이미지:</label>
          <input type="file" accept="image/*" onChange={handleImageFileChange} />
          {imagePreviewUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <img
                src={imagePreviewUrl}
                alt="미리보기"
                style={{ maxWidth: '240px', maxHeight: '240px', display: 'block' }}
              />
            </div>
          )}
          <label style={{ display: 'block', marginTop: '0.5rem' }}>
            정답: <input value={answer} onChange={(event) => setAnswer(event.target.value)} />
          </label>
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

      <button type="submit" className="button-primary" disabled={isSubmitting}>
        {isSubmitting ? '저장 중...' : initial ? '수정 저장' : '추가'}
      </button>{' '}
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  );
}

export default QuestionForm;
