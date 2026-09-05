import { useEffect, useMemo, useState } from 'react';
import type { Question, QuestionDraft, SupportedQuestionType } from '../../../../shared/types/question';
import { QUESTION_TYPE_LABELS } from '../../../../shared/questionCsv';
import QuestionForm from './QuestionForm';
import CsvImportPanel from './CsvImportPanel';

type QuestionBankProps = {
  onBack: () => void;
};

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; question: Question };

function answerSummary(question: Question): string {
  if (question.type === 'multipleChoice') {
    return question.payload.choices[question.payload.answerIndex] ?? '';
  }
  if (question.type === 'shortAnswer' || question.type === 'imageIdentify') {
    return question.payload.answer;
  }
  return '(이 유형은 아직 편집 화면이 없음)';
}

function QuestionBank({ onBack }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEra, setFilterEra] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterType, setFilterType] = useState<SupportedQuestionType | ''>('');
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });
  const [showCsvImport, setShowCsvImport] = useState(false);

  async function refresh(): Promise<void> {
    setLoading(true);
    const all = await window.questions.list();
    setQuestions(all);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      if (filterEra && !question.era.includes(filterEra)) return false;
      if (filterUnit && !question.unit.includes(filterUnit)) return false;
      if (filterType && question.type !== filterType) return false;
      return true;
    });
  }, [questions, filterEra, filterUnit, filterType]);

  async function handleFormSubmit(draft: QuestionDraft): Promise<void> {
    if (formMode.kind === 'edit') {
      await window.questions.update(formMode.question.id, draft);
    } else {
      await window.questions.create(draft);
    }
    setFormMode({ kind: 'closed' });
    await refresh();
  }

  async function handleDelete(question: Question): Promise<void> {
    const confirmed = window.confirm(`"${answerQuestionText(question)}" 문항을 삭제할까요?`);
    if (!confirmed) return;
    await window.questions.remove(question.id);
    await refresh();
  }

  function answerQuestionText(question: Question): string {
    return question.payload.question;
  }

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onBack}>
        ← 홈
      </button>
      <h1>문제은행</h1>

      <div className="field-row">
        <input placeholder="시대 검색" value={filterEra} onChange={(event) => setFilterEra(event.target.value)} />
        <input placeholder="단원 검색" value={filterUnit} onChange={(event) => setFilterUnit(event.target.value)} />
        <select value={filterType} onChange={(event) => setFilterType(event.target.value as SupportedQuestionType | '')}>
          <option value="">전체 유형</option>
          {(Object.keys(QUESTION_TYPE_LABELS) as SupportedQuestionType[]).map((key) => (
            <option key={key} value={key}>
              {QUESTION_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="button-row">
        <button type="button" className="button-primary" onClick={() => setFormMode({ kind: 'create' })}>
          문항 추가
        </button>
        <button type="button" onClick={() => setShowCsvImport((value) => !value)}>
          CSV로 가져오기
        </button>
      </div>

      {formMode.kind !== 'closed' && (
        <QuestionForm
          initial={formMode.kind === 'edit' ? formMode.question : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormMode({ kind: 'closed' })}
        />
      )}

      {showCsvImport && (
        <CsvImportPanel onImported={refresh} onClose={() => setShowCsvImport(false)} />
      )}

      {loading ? (
        <p className="muted-text">불러오는 중...</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>시대</th>
                <th>단원</th>
                <th>난이도</th>
                <th>유형</th>
                <th>질문</th>
                <th>정답</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((question) => (
                <tr key={question.id}>
                  <td>{question.era}</td>
                  <td>{question.unit}</td>
                  <td>{question.difficulty}</td>
                  <td>
                    {question.type in QUESTION_TYPE_LABELS
                      ? QUESTION_TYPE_LABELS[question.type as SupportedQuestionType]
                      : question.type}
                  </td>
                  <td className="wrap-text">{answerQuestionText(question)}</td>
                  <td className="wrap-text">{answerSummary(question)}</td>
                  <td>
                    {(question.type === 'multipleChoice' ||
                      question.type === 'shortAnswer' ||
                      question.type === 'imageIdentify') && (
                      <button type="button" onClick={() => setFormMode({ kind: 'edit', question })}>
                        수정
                      </button>
                    )}{' '}
                    <button type="button" className="button-danger" onClick={() => handleDelete(question)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QuestionBank;
