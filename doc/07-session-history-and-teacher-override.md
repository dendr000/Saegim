# 6단계: 세션 기록 저장 + 문항별 오답 통계 + 교사 수동 개입

완료일: 2026-09-04

## 목표

CLAUDE.md 구현 순서의 마지막 6단계("세션 기록 저장 + 문항별 오답 통계")와, 지난
CLAUDE.md 전수 점검에서 찾은 유의사항 미구현("게임 중 예외 상황에 교사가 수동
개입할 수 있어야 한다")을 함께 처리했다. 점수 수정 자체가 세션 데이터를 다루는
일이라 따로 하면 나중에 겹치는 코드가 생기기 때문에 묶었다.

## 설계 결정

- **교사 수동 개입은 "되돌리기"가 아니라 "직접 수정"**: 판정 하나를 되돌리는 undo는
  세 엔진 각각에 상태 스냅샷이 필요해 복잡한데, 실제로 필요한 건 "잘못된 결과를
  바로잡는 것"이지 "직전 행동 취소" 자체가 아니다.
  - 타임어택·베팅형: 점수가 곧 상태라서 `Scoreboard`에 점수를 직접 숫자로 고치는
    UI를 붙였다.
  - 땅따먹기: 점수가 아니라 "어느 팀이 어느 칸을 가졌는지"가 진짜 상태라서, 점수판
    수정으론 부족하다. 이미 점령된 칸의 소유팀을 다른 팀으로 바꾸거나 미점령으로
    되돌리는 별도 "지역 재배정" 패널을 뒀다.
- **세션 기록 = 최종 점수 + 이 세션에서 나온 모든 문제의 정오답**: 세 엔진 모두
  판정할 때마다 `{questionId, participantId, correct}`를 `answerHistory`에 쌓아두고,
  게임이 끝나면(`onFinish`) 최종 점수와 함께 넘긴다. `GameSelect`가 Setup에서 이미
  고른 학급 정보까지 합쳐 `data/sessions.json`에 저장한다.
- **오답 통계는 저장 시점이 아니라 조회 시점에 계산**: 별도 누적 카운터를 두지
  않고, `SessionHistory` 화면에서 전체 세션의 정오답 기록을 문항 id로 묶어 그때그때
  계산한다 — 저장 구조가 단순해지고 동기화 문제가 없다.

## 한 일

**세션 데이터 계층**
- `src/shared/types/session.ts`(`SessionAnswerRecord`, `GameSessionDraft`/`GameSession`),
  `src/shared/types/sessionsApi.ts`, `src/db/repositories/sessionRepository.ts`
  (`saveSession`, `getAllSessions` — 기존 `jsonFile.ts` 재사용), `src/main/ipc/sessions.ts`
  (`sessions:save`/`sessions:list`), `preload`에 `window.sessions` 노출.

**세 게임 엔진: 정오답 이력 축적 + classId 전달 + onFinish 확장**
- `useTimeAttackEngine`/`useTerritoryEngine`/`useBettingEngine` 모두 판정할 때마다
  `answerHistory`에 쌓는다.
- 세 Setup 화면: 선택한 학급의 `classId`/`className`을 Config에 포함.
- 세 Play 컴포넌트: `onFinish(scores)` → `onFinish({ scores, answers })`로 확장.
- `GameSelect.tsx`: `onFinish` 수신 시 `window.sessions.save(...)` 호출 후 결과 화면으로.

**교사 수동 개입**
- `games/_shared/Scoreboard.tsx`에 `onAdjustScore?(id, newScore)` 옵션 prop —
  있으면 각 행에 점수 직접 입력/저장/취소 UI.
- `useTimeAttackEngine`/`useBettingEngine`에 `ADJUST_SCORE` 액션.
- `useTerritoryEngine`에 `REASSIGN_REGION(regionId, newOwnerTeamId | null)` 액션.
  `TerritoryPlay.tsx`에 점령된 칸만 나열해 소유팀을 바꾸거나 미점령으로 되돌리는
  "지역 재배정" 패널 추가.

**통계 화면**
- `pages/SessionHistory/SessionHistory.tsx`: 지난 세션 목록(날짜/학급/게임종류/최종점수,
  최신순) + 문항별 오답 통계(질문/시대·단원/정답수/오답수/오답률, 오답률 내림차순).
  `Home.tsx`에 "세션 기록" 버튼, `App.tsx`에 라우팅 추가.

## 검증 결과

- `npm run typecheck` 통과.
- **리듀서 로직**: 세 엔진의 `createInitialState`/reducer를 임시로 export해 `tsx`로
  직접 실행, 15개 항목 검증 — `ADJUST_SCORE`가 지정 점수로 정확히 바뀌는지,
  `REASSIGN_REGION`이 다른 팀/미점령으로 정확히 덮어쓰는지, `answerHistory`가
  `questionId`/`participantId`/`correct` 정확한 값으로 누적되는지. 검증 후 임시
  export 원복.
- **sessionRepository**: `main/index.ts`에 임시 자가 테스트 코드를 넣고 실제
  `npm run dev`로 실행 — 저장된 세션 id/학급명/전체 세션 수/답안 수가 모두 기대값과
  일치, `data/sessions.json` 파일 내용도 `GameSession` 타입 구조와 정확히 일치함을
  확인. 검증 후 임시 코드 제거, `data/sessions.json`을 `[]`로 원복.
- **화면 흐름**: Electron 없이 `main.tsx`를 임시로 디버그 하네스로 바꿔(3개 게임/
  페이지를 하드코딩된 config로 직접 렌더링, `window.sessions`/`window.questions`는
  fixture로 mock) 브라우저에서 실제 클릭으로 확인.
  - 타임어택 점수판 "수정" 클릭 → 숫자 입력 → "저장" → 점수가 정확히 반영되고
    순위 재정렬됨을 확인 (베팅형도 동일한 `Scoreboard` 컴포넌트를 그대로 재사용).
  - 땅따먹기: 지역 선택 → 태깅된 문제만 출제됨(고구려 지역 → 고구려 태그 문제) →
    정답 처리 → 점령 → "지역 재배정" 패널 등장 → 다른 팀으로 재배정 시 칸 수가
    즉시 이동, "미점령으로" 선택 시 칸 수가 0으로 돌아가고 모든 칸이 미점령이 되자
    패널 자체가 사라짐(둘 다 정상).
  - `SessionHistory`: fixture 세션 1건 + 문항 2건으로 세션 목록(날짜/학급/게임종류/
    최종점수)과 오답 통계(오답률 100%인 문항이 50%인 문항보다 위로 정렬)가 정확히
    렌더링됨을 확인.
  - 확인 후 `main.tsx` 원복, 개발 서버·잔여 electron/node 프로세스 정리.
- **최종 부팅 확인**: 정리 후 실제 `npm run dev`(Electron)로 재부팅해 임시 코드
  흔적 없이 깨끗하게 뜨는지 확인 (main/preload 빌드 성공, `paths` 정상 로그, 셀프
  테스트 로그 없음).

## 확인해 주세요

1. 학급 관리에서 팀/학생이 준비된 학급으로 아무 게임이나 한 판 플레이.
2. 게임 도중 점수판(타임어택/베팅형)의 "수정" 버튼으로 점수를 임의로 바꿔보고
   반영되는지 확인. 땅따먹기는 칸을 하나 점령한 뒤 화면 아래 "지역 재배정"
   패널에서 다른 팀으로 바꾸거나 "미점령으로" 되돌려보기.
3. 게임을 끝까지 진행(또는 "게임 종료"로 수동 종료)한 뒤, 홈 → "세션 기록"에서
   방금 세션이 목록에 뜨는지, 이번 게임에서 나온 문제들이 "문항별 오답 통계"에
   반영되는지 확인.
4. 게임을 몇 판 더 진행해 같은 문제가 여러 세션에서 나오면 오답 통계가 세션을
   넘어 누적되는지(정답수/오답수 합산) 확인.

## 다음 단계

CLAUDE.md 구현 순서 1~6단계가 모두 끝났다. 다음은:
- 포터블 exe 재검증(1단계 이후 코드가 많이 늘어서, 실제 exe 빌드 후 옮겨서 실행하는
  전체 재검증이 필요).
- `Answer` 타입 통일(땅따먹기/베팅형이 타임어택처럼 `Answer{participantId,value,submittedAt}`을
  문자 그대로 재사용하진 않음 — 낮은 우선순위).
- UI 스타일링(교실 TV/프로젝터 가독성 — 글자·버튼 크게). 기능을 다 끝내고 나서 한
  번에 입히기로 함.
