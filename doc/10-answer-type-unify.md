# Answer 타입 통일

완료일: 2026-09-04

## 목표

CLAUDE.md 절대 규칙 3 "게임 로직은 응답의 출처를 몰라야 한다. 모든 게임은 정규화된
응답 객체만 받는다"에 따라, 세 게임 엔진이 판정 입력을 받는 경계(리듀서 액션)를
`games/_shared/types.ts`의 `Answer{participantId, value, submittedAt}` 하나로 통일.
타임어택은 이미 `Answer`를 그대로 썼지만, 땅따먹기·베팅형은 `value`/`teamId`를
따로따로 받고 있어 세 엔진의 입력 경계가 일치하지 않았다.

## 한 일

- `games/territory/useTerritoryEngine.ts`: `JUDGE_ANSWER` 액션을
  `{ value: unknown }` → `{ answer: Answer }`로 변경. 리듀서는 이제
  `action.answer.participantId`로 어느 팀이 칸을 점령하는지 정하고(기존엔
  `state.currentTeamIndex`로 직접 구한 `currentTeam.id`를 썼음),
  `action.answer.value`로 채점한다. 공개 함수 `judgeAnswer(value)`의 시그니처는
  그대로 두고, 내부에서 현재 턴 팀을 `participantId`로 채워 `Answer`를 만들어
  dispatch하도록 바꿔서 — 호출부(`QuestionJudgePrompt`/`TerritoryPlay`)는 변경 없음.
- `games/betting/useBettingEngine.ts`: `SET_TEAM_ANSWER` 액션을
  `{ teamId, value }` → `{ answer: Answer }`로 변경. 리듀서는
  `action.answer.participantId`를 키로 `answers` 레코드에 저장. 공개 함수
  `setTeamAnswer(teamId, value)` 시그니처는 그대로 두고 내부에서 `Answer`로
  감싸 dispatch — 호출부(`BettingPlay`/`TeamAnswerRow`)도 변경 없음.
- 내부 상태(`BettingState.answers: Record<string, unknown>` 등)나 화면 컴포넌트는
  건드리지 않았다 — 통일 대상은 "게임 로직이 소비하는 입력 경계"이지 내부 저장
  구조가 아니라서, 불필요한 연쇄 변경을 피했다.

## 검증 결과

- `npm run typecheck` 통과.
- 리듀서 내부 함수를 임시로 export해 `tsx`로 직접 실행, 11개 항목 검증 후 원복:
  - 땅따먹기: `JUDGE_ANSWER`가 `Answer.participantId`로 칸을 정확히 점령시키는지,
    오답이면 그대로 미점령으로 남는지, `answerHistory`가 `Answer`에서 온
    `participantId`/`correct`/`questionId`를 정확히 기록하는지.
  - 베팅형: `SET_TEAM_ANSWER`가 `Answer.participantId`를 키로 값을 저장하는지,
    `SETTLE_ROUND` 정산 결과(정답 팀 +배팅액/오답 팀 -배팅액)와 `answerHistory`가
    두 팀 모두 정확한지.
- UI(JSX)나 컴포넌트 prop은 전혀 바뀌지 않아 브라우저 재검증은 생략 —
  순수 내부 리듀서/타입 변경이라 화면에 관찰 가능한 차이가 없음.
- 최종 `npm run dev`(Electron)로 재부팅해 정상 기동 확인.

## 다음 단계

CLAUDE.md 구현 순서 1~6단계, 포터블 exe 재검증, UI 스타일링, Answer 타입 통일까지
모두 끝났다. 이제 남은 건 CLAUDE.md에 "향후 추가"로 명시된 게임 모드들뿐이며,
이건 사용자가 우선순위를 올리기 전까지는 손대지 않는다. 그 사이 떠오르는 아이디어는
[doc/ideas.md](ideas.md)에 계속 기록.
