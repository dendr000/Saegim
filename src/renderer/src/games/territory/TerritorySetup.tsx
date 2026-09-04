import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import QuestionFilterPicker, {
  applyQuestionFilter,
  createEmptyQuestionFilter,
  type QuestionFilterState
} from '../_shared/QuestionFilterPicker';
import { parseRegionIdsFromSvg, type MapRegion } from './mapSvg';
import { findEligibleQuestions } from './regionQuestionMatch';
import type { TerritoryConfig } from './types';

type TerritorySetupProps = {
  onStart: (config: TerritoryConfig) => void;
  onCancel: () => void;
};

function TerritorySetup({ onStart, onCancel }: TerritorySetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mapFiles, setMapFiles] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMapFile, setSelectedMapFile] = useState('');
  const [mapSvgContent, setMapSvgContent] = useState('');
  const [regions, setRegions] = useState<MapRegion[]>([]);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(createEmptyQuestionFilter());

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
    window.maps.list().then((files) => {
      setMapFiles(files);
      setSelectedMapFile((current) => current || files[0] || '');
    });
  }, []);

  useEffect(() => {
    if (!selectedMapFile) {
      setMapSvgContent('');
      setRegions([]);
      return;
    }
    window.maps.get(selectedMapFile).then((content) => {
      setMapSvgContent(content);
      setRegions(parseRegionIdsFromSvg(content));
    });
  }, [selectedMapFile]);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;
  const teams = selectedClass?.teams ?? [];

  // 객관식/단답형만 지원 (문제은행 CRUD와 같은 범위). 지역별 매칭은 아래에서 각각 계산한다.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const supportedQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  const regionQuestionCounts = regions.map((region) => ({
    region,
    count: findEligibleQuestions(supportedQuestions, region).length
  }));
  const hasUnplayableRegion = regionQuestionCounts.some((entry) => entry.count === 0);

  const canStart = Boolean(selectedClass) && teams.length >= 2 && regions.length > 0;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    onStart({
      teams: teams.map((team) => ({ id: team.id, label: team.name })),
      regions,
      mapSvgContent,
      questions: supportedQuestions,
      classId: selectedClass.id,
      className: selectedClass.name
    });
  }

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onCancel}>
        ← 뒤로
      </button>
      <h1>땅따먹기 설정</h1>

      <div className="field-row">
        <label>
          학급:{' '}
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            <option value="">선택</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedClass && teams.length < 2 && (
        <p className="error-text">
          이 학급에는 팀이 {teams.length}개뿐입니다. 학급 관리에서 팀을 2개 이상 만들어주세요.
        </p>
      )}
      {selectedClass && teams.length >= 2 && <p>참가 팀: {teams.map((team) => team.name).join(', ')}</p>}

      <div className="field-row">
        <label>
          지도:{' '}
          <select value={selectedMapFile} onChange={(event) => setSelectedMapFile(event.target.value)}>
            {mapFiles.length === 0 && <option value="">사용 가능한 지도 없음</option>}
            {mapFiles.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </label>
      </div>

      <QuestionFilterPicker questions={typeSupportedQuestions} filter={questionFilter} onChange={setQuestionFilter} />

      {regions.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p>
            지역별 배정 가능한 문제 수 (문항의 시대/단원에 지역 이름이 들어가야 매칭됩니다):
          </p>
          <ul>
            {regionQuestionCounts.map(({ region, count }) => (
              <li key={region.id} className={count === 0 ? 'error-text' : undefined}>
                {region.label}: {count}개{count === 0 ? ' — 이 지역은 태그된 문제가 없어 점령할 수 없습니다' : ''}
              </li>
            ))}
          </ul>
          {hasUnplayableRegion && (
            <p className="error-text">
              위 지역은 문제은행에서 시대 또는 단원에 지역 이름을 넣어 태깅해야 점령 가능해집니다.
              태깅 없이도 시작은 할 수 있지만, 그 지역은 아무도 못 가져갑니다.
            </p>
          )}
        </div>
      )}

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default TerritorySetup;
