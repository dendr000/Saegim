# 문항 필터 · 참가자 선택 기억

완료일: 2026-09-05

## 배경

사용자: "같은 배열, 같은 시대, 같은 단원 등 다시 할 수도 있는 가능성을 상정해서
이전 눌러둔 게 저장되어 있도록 하면 좋을 듯."

19번 작업(`QuestionFilterPicker`)과 그 전 18번 작업(`ParticipantPicker`)으로
설정 화면마다 체크박스가 늘었는데, 매번 학급을 열 때마다 처음부터 다시 눌러야
했다. 같은 학급을 다음 시간에 또 가르치거나, 같은 단원을 다음 게임 모드에서도
다루는 경우가 흔할 것이므로 마지막으로 쓴 선택을 기억해서 되살린다.

## 설계 결정

- **저장 매체는 `localStorage`, 새 IPC나 리포지토리는 만들지 않는다.** 이
  앱은 `paths.ts`에서 `app.setPath('userData', DATA_DIR)`로 포터블 exe 옆
  `data/` 폴더를 userData로 재지정해뒀다 — Electron의 `localStorage`도 그
  경로 밑(`data/Local Storage/`)에 저장되므로, 이미 있는 포터블 재지정
  인프라를 그대로 타고 USB로 어디서든 같은 값이 따라간다. CLAUDE.md의
  "SQLite 도입 금지"와도 무관한 가벼운 UI 상태라 `db/repositories/`를
  건드릴 이유가 없다.
- **문항 필터(시대/단원/난이도)는 게임 모드별로 기억한다(학급과 무관).**
  이 선택은 "문제은행에서 어떤 문제를 쓸지"에 대한 것이지 특정 학급에 대한
  것이 아니라서, 학급을 바꿔도 유지된다. 키: `saegim:questionFilter:<게임모드>`.
- **참가자 선택(개인/모둠 + 체크된 대상)은 게임 모드 + 학급 조합으로 기억한다.**
  학급마다 학생·모둠 목록이 다르므로 학급 단위로 구분해야 값이 의미 있다.
  키: `saegim:participants:<게임모드>:<학급id>`. 학급을 선택하면 그 학급에
  저장된 값이 있는지 먼저 찾고, 있으면 복원(단, 그 사이 삭제된 학생/모둠
  id는 걸러낸다 — 전부 걸러졌으면 안전하게 전체 선택으로 폴백), 없으면 기존
  그대로 전체 선택 기본값.
- **저장 실패는 조용히 무시한다.** 프라이빗 모드 등으로 `localStorage`
  접근이 막혀도 필터 기억은 있으면 좋은 기능이지 필수 기능이 아니므로,
  저장/복원 둘 다 try/catch로 감싸 실패 시 그냥 빈 값/기존 동작으로
  폴백한다(앱이 죽거나 게임 진행이 막히면 안 됨).

## 한 일

- `games/_shared/localPreferences.ts`(신규): `loadPreference`/`savePreference`
  — JSON 직렬화 + try/catch 감싼 `localStorage` 래퍼. 다른 파일들이 공유.
- `games/_shared/QuestionFilterPicker.tsx`: `loadQuestionFilter(gameMode)`/
  `saveQuestionFilter(gameMode, filter)` 추가(`Set`을 배열로 직렬화).
- `games/_shared/ParticipantPicker.tsx`: `loadParticipantSelection(gameMode,
  classId)`/`saveParticipantSelection(...)` 추가.
- `timeAttack/TimeAttackSetup.tsx`, `initialLetter/InitialLetterSetup.tsx`,
  `hintDeduction/HintDeductionSetup.tsx`, `bossRaid/BossRaidSetup.tsx` —
  참가자 선택 + 문항 필터 둘 다 저장/복원하도록 개조. 학급 변경 시
  선택했던 참가자(모드 포함)를 복원하는 effect로 교체하고, 모드 전환·
  체크박스 토글 지점에서 저장하도록 래퍼 함수(`handleParticipantModeChange`,
  `toggleParticipant`, `handleQuestionFilterChange`)를 추가했다.
- `betting/BettingSetup.tsx`, `territory/TerritorySetup.tsx`,
  `questionBingo/QuestionBingoSetup.tsx` — 참가자 선택 UI가 없는(팀은
  항상 전체 참가) 게임이라 문항 필터 저장/복원만 추가.

## 검증 결과

- `loadPreference`/`savePreference`를 `tsx`로 직접 실행(mock `localStorage`):
  없는 키는 null, 저장한 값 복원, 손상된 JSON은 조용히 null로 폴백 — 3개
  케이스 확인.
- `npm run typecheck` 통과.
- 브라우저로(fixture mock 디버그 하네스) 실제 새로고침 검증: 타임어택에서
  학급 선택 후 학생 중 한 명 체크 해제 + 시대 필터(조선후기) 체크 →
  페이지 새로고침(앱을 완전히 다시 연 것과 동일) → 같은 화면에 다시
  들어가자 체크 해제했던 학생은 여전히 해제, 조선후기 필터도 그대로
  체크된 상태로 복원됨을 DOM `checked` 속성으로 직접 확인. 초성 퀴즈
  화면은 별도로 필터를 저장한 적이 없어 빈 상태 그대로인 것도 확인해
  게임 모드별로 키가 겹치지 않는지 검증.
- 최종 `npm run dev`(Electron) 재부팅: 에러 없이 정상 기동 확인.

## 다음 단계

CSS/비주얼 다듬기는 사용자가 "일단 게임 모드 다 만든 뒤에" 하기로 명시적으로
미뤄둠 — 이후 요청 전까지 손대지 않는다. 남은 게임 모드(폭탄 돌리기 등)는
사용자 지시가 있을 때 진행.
