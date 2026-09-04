import { useState, type CSSProperties } from 'react';
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
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <h3>CSV로 가져오기</h3>
      <p>엑셀·구글시트에서 표를 복사해 아래에 붙여넣으세요. 첫 줄은 반드시 아래와 같은 제목 줄이어야 합니다.</p>
      <pre style={{ background: '#f5f5f5', padding: '0.5rem', overflowX: 'auto' }}>{EXAMPLE_CSV}</pre>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        style={{ width: '100%' }}
        placeholder={QUESTION_CSV_HEADERS.join(',')}
      />

      <div style={{ margin: '0.5rem 0' }}>
        <button type="button" onClick={handlePreview} disabled={!text.trim()}>
          미리보기
        </button>{' '}
        <button type="button" onClick={handleImport} disabled={validCount === 0}>
          가져오기 ({validCount}개)
        </button>{' '}
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      {resultMessage && <p>{resultMessage}</p>}

      {rows.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={cellStyle}>행</th>
              <th style={cellStyle}>상태</th>
              <th style={cellStyle}>내용</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td style={cellStyle}>{row.rowNumber}</td>
                <td style={cellStyle}>{row.ok ? '성공' : '실패'}</td>
                <td style={cellStyle}>{row.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cellStyle: CSSProperties = { border: '1px solid #ddd', padding: '0.25rem 0.5rem', textAlign: 'left' };

export default CsvImportPanel;
