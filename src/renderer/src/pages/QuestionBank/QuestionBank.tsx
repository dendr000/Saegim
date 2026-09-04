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
  if (question.type === 'shortAnswer') {
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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <button type="button" onClick={onBack}>
        ← 홈
      </button>
      <h1>문제은행</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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

      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => setFormMode({ kind: 'create' })}>
          문항 추가
        </button>{' '}
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
        <p>불러오는 중...</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={cellStyle}>시대</th>
              <th style={cellStyle}>단원</th>
              <th style={cellStyle}>난이도</th>
              <th style={cellStyle}>유형</th>
              <th style={cellStyle}>질문</th>
              <th style={cellStyle}>정답</th>
              <th style={cellStyle}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((question) => (
              <tr key={question.id}>
                <td style={cellStyle}>{question.era}</td>
                <td style={cellStyle}>{question.unit}</td>
                <td style={cellStyle}>{question.difficulty}</td>
                <td style={cellStyle}>
                  {question.type in QUESTION_TYPE_LABELS
                    ? QUESTION_TYPE_LABELS[question.type as SupportedQuestionType]
                    : question.type}
                </td>
                <td style={cellStyle}>{answerQuestionText(question)}</td>
                <td style={cellStyle}>{answerSummary(question)}</td>
                <td style={cellStyle}>
                  {(question.type === 'multipleChoice' || question.type === 'shortAnswer') && (
                    <button type="button" onClick={() => setFormMode({ kind: 'edit', question })}>
                      수정
                    </button>
                  )}{' '}
                  <button type="button" onClick={() => handleDelete(question)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cellStyle = { border: '1px solid #ddd', padding: '0.25rem 0.5rem', textAlign: 'left' as const };

export default QuestionBank;
