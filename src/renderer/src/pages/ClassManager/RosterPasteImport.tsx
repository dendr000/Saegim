import { useState } from 'react';
import { parseRosterText, type ParsedRosterEntry } from '../../../../shared/schoolClassRoster';

type RosterPasteImportProps = {
  onImport: (entries: ParsedRosterEntry[]) => void;
  onClose: () => void;
};

function RosterPasteImport({ onImport, onClose }: RosterPasteImportProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedRosterEntry[]>([]);

  function handlePreview(): void {
    setPreview(parseRosterText(text));
  }

  function handleImport(): void {
    if (preview.length === 0) return;
    onImport(preview);
    setText('');
    setPreview([]);
  }

  return (
    <div className="panel">
      <h4>명단 붙여넣기</h4>
      <p>한 줄에 한 명씩, "번호,이름" 또는 이름만 붙여넣으세요.</p>
      <pre className="code-block">{'1,김민준\n2,이서연\n박도윤'}</pre>

      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} style={{ width: '100%' }} />

      <div className="button-row" style={{ marginTop: '0.5rem' }}>
        <button type="button" onClick={handlePreview} disabled={!text.trim()}>
          미리보기
        </button>
        <button type="button" className="button-primary" onClick={handleImport} disabled={preview.length === 0}>
          추가 ({preview.length}명)
        </button>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      {preview.length > 0 && (
        <ul>
          {preview.map((entry, index) => (
            <li key={index}>
              {entry.number !== undefined ? `${entry.number}. ` : ''}
              {entry.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RosterPasteImport;
