import type { SchoolClass } from '../../../../shared/types/schoolClass';
import { loadPreference, savePreference } from './localPreferences';

export type ParticipantMode = 'student' | 'team';
export type ParticipantOption = { id: string; label: string };

export type PersistedParticipantSelection = { mode: ParticipantMode; selectedIds: string[] };

// 게임 모드 + 학급 조합으로 기억한다 — 참가자 목록은 학급마다 다르므로 학급 단위로
// 구분해야 한다("같은 배열로 다시 할 수도 있으니" 이전 선택을 되살린다).
function storageKeyFor(gameMode: string, classId: string): string {
  return `saegim:participants:${gameMode}:${classId}`;
}

export function loadParticipantSelection(gameMode: string, classId: string): PersistedParticipantSelection | null {
  return loadPreference<PersistedParticipantSelection>(storageKeyFor(gameMode, classId));
}

export function saveParticipantSelection(
  gameMode: string,
  classId: string,
  selection: PersistedParticipantSelection
): void {
  savePreference<PersistedParticipantSelection>(storageKeyFor(gameMode, classId), selection);
}

// 여러 학급을 가르치다 보면 학생 이름을 일일이 기억 못 할 수 있다 — 학생 개인
// 대신 학급 관리에서 이미 이름 붙여둔 모둠("1조", "호랑이 조" 등) 단위로도
// 참가시킬 수 있게 한다.
export function participantOptionsFor(schoolClass: SchoolClass | null, mode: ParticipantMode): ParticipantOption[] {
  if (!schoolClass) return [];
  return mode === 'student'
    ? schoolClass.students.map((student) => ({ id: student.id, label: student.name }))
    : schoolClass.teams.map((team) => ({ id: team.id, label: team.name }));
}

type ParticipantPickerProps = {
  schoolClass: SchoolClass;
  mode: ParticipantMode;
  onModeChange: (mode: ParticipantMode) => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

function ParticipantPicker({ schoolClass, mode, onModeChange, selectedIds, onToggle }: ParticipantPickerProps) {
  const options = participantOptionsFor(schoolClass, mode);

  return (
    <>
      <div className="field-row">
        <label>
          <input type="radio" checked={mode === 'student'} onChange={() => onModeChange('student')} /> 학생 개인
        </label>
        <label>
          <input type="radio" checked={mode === 'team'} onChange={() => onModeChange('team')} /> 모둠(팀)
        </label>
      </div>

      {mode === 'team' && schoolClass.teams.length === 0 && (
        <p className="error-text">이 학급에는 모둠이 없습니다. 학급 관리에서 모둠을 먼저 만들어주세요.</p>
      )}

      <div className="field-row">
        <p style={{ width: '100%', margin: 0 }}>
          참가 {mode === 'student' ? '학생' : '모둠'} ({selectedIds.size}개 선택됨):
        </p>
        {options.map((option) => (
          <label key={option.id}>
            <input type="checkbox" checked={selectedIds.has(option.id)} onChange={() => onToggle(option.id)} />{' '}
            {option.label}
          </label>
        ))}
      </div>
    </>
  );
}

export default ParticipantPicker;
