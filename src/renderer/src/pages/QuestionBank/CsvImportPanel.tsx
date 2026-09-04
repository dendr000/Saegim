import { useState } from 'react';
import Papa from 'papaparse';
import type { QuestionDraft } from '../../../../shared/types/question';
import { QUESTION_CSV_HEADERS, parseCsvRowToDraft } from '../../../../shared/questionCsv';

type PreviewRow = { rowNumber: number; ok: boolean; summary: string; draft?: QuestionDraft };

type CsvImportPanelProps = {
  onImported: () => void;
  onClose: () => void;
};

const EXAMPLE_CSV = [
  QUESTION_CSV_HEADERS.join(','),
  '삼국시대,통일신라,1,객관식,신라의 삼국통일 연도는?,660,668,676,698,668',
  '조선후기,실학,2,단답형,실학의 대표 학자는?,,,,,정약용'
].join('\n');

function CsvImportPanel({ onImported, onClose }: CsvImportPanelProps) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  function handlePreview(): void {
    setResultMessage(null);

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',
      transformHeader: (header) => header.trim()
    });

    const preview: PreviewRow[] = parsed.data.map((row, index) => {
      const result = parseCsvRowToDraft(row);
      if (result.ok) {
        return {
          rowNumber: index + 2, // 1행은 헤더
          ok: true,
          summary: `${result.draft.era} / ${result.draft.unit} / ${result.draft.payload.question}`,
          draft: result.draft
        };
      }
      return { rowNumber: index + 2, ok: false, summary: result.error };
    });

    setRows(preview);
  }

  async function handleImport(): Promise<void> {
    const validDrafts = rows.filter((row) => row.ok && row.draft).map((row) => row.draft as QuestionDraft);
    if (validDrafts.length === 0) return;

    const result = await window.questions.bulkCreate(validDrafts);
    setResultMessage(`${result.created.length}개 추가됨, ${result.errors.length}개 실패`);
    if (result.created.length > 0) {
      onImported();
    }
  }

  const validCount = rows.filter((row) => row.ok).length;

  return (
    <div className="panel">
      <h3>CSV로 가져오기</h3>
      <p>엑셀·구글시트에서 표를 복사해 아래에 붙여넣으세요. 첫 줄은 반드시 아래와 같은 제목 줄이어야 합니다.</p>
      <pre className="code-block">{EXAMPLE_CSV}</pre>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        style={{ width: '100%' }}
        placeholder={QUESTION_CSV_HEADERS.join(',')}
      />

      <div className="button-row" style={{ marginTop: '0.5rem' }}>
        <button type="button" onClick={handlePreview} disabled={!text.trim()}>
          미리보기
        </button>
        <button type="button" className="button-primary" onClick={handleImport} disabled={validCount === 0}>
          가져오기 ({validCount}개)
        </button>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      {resultMessage && <p>{resultMessage}</p>}

      {rows.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>행</th>
                <th>상태</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber}>
                  <td>{row.rowNumber}</td>
                  <td>{row.ok ? '성공' : '실패'}</td>
                  <td className="wrap-text">{row.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CsvImportPanel;
