export type Student = {
  id: string;
  number?: number;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  studentIds: string[];
};

export type SchoolClass = {
  id: string;
  name: string;
  students: Student[];
  teams: Team[];
};

export type SchoolClassDraft = Omit<SchoolClass, 'id'>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStudent(value: unknown): value is Student {
  if (typeof value !== 'object' || value === null) return false;
  const student = value as Record<string, unknown>;
  if (!isNonEmptyString(student.id)) return false;
  if (!isNonEmptyString(student.name)) return false;
  if (student.number !== undefined && typeof student.number !== 'number') return false;
  return true;
}

function isTeam(value: unknown, studentIds: Set<string>): value is Team {
  if (typeof value !== 'object' || value === null) return false;
  const team = value as Record<string, unknown>;
  if (!isNonEmptyString(team.id)) return false;
  if (!isNonEmptyString(team.name)) return false;
  if (!Array.isArray(team.studentIds)) return false;
  // 팀에 배정된 학생 id가 실제 이 학급의 학생 목록에 존재하는지까지 확인한다.
  return team.studentIds.every((studentId) => typeof studentId === 'string' && studentIds.has(studentId));
}

export function isSchoolClassDraft(value: unknown): value is SchoolClassDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;

  if (!isNonEmptyString(draft.name)) return false;
  if (!Array.isArray(draft.students) || !draft.students.every(isStudent)) return false;

  const studentIds = new Set((draft.students as Student[]).map((student) => student.id));
  if (!Array.isArray(draft.teams) || !draft.teams.every((team) => isTeam(team, studentIds))) return false;

  return true;
}
