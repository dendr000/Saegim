# 카드 매칭 (개념 학습형)

완료일: 2026-09-05

## 목표

[23-remaining-game-modes-plan.md](23-remaining-game-modes-plan.md)에서 정한
6순위 게임. CLAUDE.md: "카드 매칭 — 용어와 정의를 짝짓기. 정답률보다 반복
노출이 목적." 지금까지 만든 8개 게임은 전부 "교사가 정오답을 판정"하는
구조였지만, 이번엔 카드 두 장이 짝인지 앱이 스스로 판정할 수 있어 **교사의
판정 단계가 아예 없는 첫 게임**이다.

## 설계 결정

- **새 문항 타입을 만들지 않았다.** 기존 단답형(`shortAnswer`)의
  `payload.answer`(용어 카드)와 `payload.question`(정의 카드)을 그대로 한
  쌍으로 삼는다. 객관식은 제외(초성 퀴즈·힌트 차감형과 같은 이유).
- **턴은 원형 순환하되, 폭탄 돌리기와 정반대 규칙이다.** 짝을 맞히면
  **같은 참가자가 턴을 유지**하고 한 번 더 뒤집을 수 있다(전통 카드 매칭
  게임 규칙). 못 맞히면 두 카드를 1.5초간 보여준 뒤(암기 기회) 다시 가리고
  다음 참가자에게 턴이 넘어간다.
- **오답 공개 시간차는 `useCountdownTimer`가 아니라 새 단발성 지연으로
  처리했다.** `useCardMatchingEngine` 훅 안에 `useEffect`+`setTimeout`으로
  `pendingMismatch`가 true인 동안만 1.5초 뒤 `RESOLVE_MISMATCH`를 dispatch —
  기존 카운트다운 훅은 "숫자를 보여주며 흐르는 시간"용이라 이 "한 번만
  실행되는 지연"에는 안 맞아서 새로 만들었다.
- **전체 시간제한이 없다.** CLAUDE.md가 "정답률보다 반복 노출이 목적"이라고
  명시했으므로 속도 압박용 타이머를 붙이지 않았다 — 셀프 페이스.
- **참가자는 개인/모둠 둘 다 가능**(`ParticipantPicker` 재사용), 최소 인원
  제한 없음(혼자 복습용으로도 의미 있음).
- **점수는 콤보 공식 재사용.** 연속으로 짝을 맞히는 구간(턴이 안 넘어가고
  계속 이어짐)에 `timeAttack/scoring.ts`의
  `calculateScoreForCorrectAnswer(difficulty, combo)`를 그대로 재사용 — 못
  맞히면 콤보 리셋.
- **카드 쌍 개수를 교사가 정한다.** 필터링된 문제 풀 전체를 다 쓰면 격자가
  너무 커질 수 있어, Setup에서 이번 판에 쓸 쌍 개수를 고르고(기본값
  `min(8, 사용 가능 문제 수)`, 풀 크기에 따라 자동 제안) 그만큼 무작위로
  표본을 뽑아 넘긴다.

## 한 일

- `games/cardMatching/` 신규: `types.ts`, `useCardMatchingEngine.ts`
  (`FLIP_CARD`/`RESOLVE_MISMATCH`/`END_GAME_MANUALLY`/`ADJUST_SCORE`),
  `CardGrid.tsx`(문제 빙고의 `.bingo-grid`/`.bingo-cell` 클래스 재사용),
  `CardMatchingSetup.tsx`(참가자·문항 필터 저장/복원 + 카드 쌍 개수 자동
  제안), `CardMatchingPlay.tsx`(타이머 UI 없이 "찾은 짝: N/M" 진행 표시).
- `shared/types/session.ts`, `SessionHistory.tsx`, `gameModeCatalog.tsx`
  (카드 두 장 모양 아이콘, `category:'concept'`), `GameSelect.tsx`에 새
  플로우 단계 연결.

## 검증 결과

- `npm run typecheck` 통과.
- 리듀서를 `tsx`로 직접 실행(임시 export 후 삭제): 카드 뒤집기, 이미
  뒤집힌/맞춘 카드 재클릭 무시, 짝 맞음(턴 유지·점수·콤보 반영)/안 맞음
  (`pendingMismatch`·콤보 리셋), `pendingMismatch` 동안 새 입력 무시,
  `RESOLVE_MISMATCH`로 턴 원형 이동, 모든 짝 완료 시 자동 종료, 종료 후
  액션 무시, 수동 종료·점수 수정 — 총 20개 케이스 확인.
- 브라우저로(fixture mock 디버그 하네스) 실제 플레이: 오답 시 "다시
  도전하세요" 표시 후 카드가 다시 가려지고 다음 참가자로 턴 이동, 정답 시
  "정답! — 용어 — 정의" 표시와 함께 점수 반영 및 같은 참가자 턴 유지 확인.
  `window.sessions.save` 호출을 가로채 `gameMode: "cardMatching"`과 정확한
  `finalScores`/`answers` 확인.
- 최종 `npm run dev`(Electron) 재부팅: 에러 없이 정상 기동 확인.

## 다음 단계

7순위 골든벨 서바이벌, 8순위 찬스카드가 다음 대상 — 사용자가 이미 6~8번을
순서대로 진행하기로 확인했다.
