// 필터·참가자 선택처럼 "다시 같은 설정으로 할 가능성이 높은" 값을 기기에 기억해두는
// 용도. 이 앱은 userData 경로가 exe 옆 data/ 폴더로 재지정되어 있어(paths.ts)
// localStorage도 자동으로 그 폴더 밑에 저장된다 — 포터블 원칙(USB로 어디서든 같은
// 데이터)을 새 IPC 없이 그대로 따른다. 프라이빗 모드 등으로 접근이 막혀도 필터 기억은
// 있으면 좋은 기능일 뿐이라 조용히 무시한다.
export function loadPreference<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function savePreference<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 무시
  }
}
