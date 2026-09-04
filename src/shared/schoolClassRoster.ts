export type ParsedRosterEntry = { number?: number; name: string };

/**
 * 한 줄에 한 명씩, "번호,이름" / "번호<TAB>이름" / "이름"만 있는 텍스트를 파싱한다.
 * 문항 CSV와 달리 헤더 줄이 없다 — 학생 명단은 그만큼 구조가 단순하다.
 */
export function parseRosterText(text: string): ParsedRosterEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line
        .split(/[,\t]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      if (parts.length >= 2) {
        const maybeNumber = Number(parts[0]);
        if (Number.isInteger(maybeNumber)) {
          return { number: maybeNumber, name: parts.slice(1).join(' ') };
        }
      }

      return { name: parts.join(' ') || line };
    })
    .filter((entry) => entry.name.length > 0);
}
