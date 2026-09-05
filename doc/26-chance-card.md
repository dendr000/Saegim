# 찬스카드 (팀 대항형)

완료일: 2026-09-05

## 목표

[23-remaining-game-modes-plan.md](23-remaining-game-modes-plan.md)에서 정한
8순위 게임(사용자가 6~8번을 순서대로 진행하기로 한 마지막 항목).
CLAUDE.md: "찬스카드 — 정답 시 랜덤 카드 획득(점수 훔치기, 순서 뒤집기,
방어막). 실력차를 흐리는 가장 강력한 장치."

## 설계 결정

- **기반 진행 방식은 땅따먹기에서 지도·칸 선택만 뺀 릴레이 형식.**
  `territory/useTerritoryEngine.ts`의 "판정 후 정답 여부와 무관하게 항상
  다음 팀 턴으로 넘어간다"는 규칙을 그대로 가져왔다 — 칸(지역) 개념이 없어
  팀이 원형으로 돌며 문제를 푸는 구조만 남는다.
- **판정 UI는 `territory/QuestionJudgePrompt.tsx`를 그대로 재사용했다** —
  이미 완전히 범용적이라(질문/보기/판정 버튼만 있고 땅따먹기 상태에 의존
  안 함) 문제 빙고에 이어 두 번째로 그대로 가져다 썼다.
- **카드 3종만 만들었다**(CLAUDE.md 예시와 정확히 일치): 점수 훔치기(대상
  팀을 골라 고정 액수 이전, 대상 점수보다 많이는 못 훔침), 순서 뒤집기(턴
  순서 배열 즉시 반전), 방어막(다음 훔치기 1회를 막는 1회용 보호막). 정답
  시 셋 중 하나를 균등 확률로 뽑는다.
- **훔치기 카드만 "대상 선택"이라는 별도 단계가 필요하다.** 뽑은 직후
  `pendingCard: 'steal'`로 두고 턴을 넘기지 않은 채 팀 선택 버튼을 보여주고,
  나머지 두 카드는 즉시 적용 후 바로 다음 팀으로 넘어간다.
- **카드 발동 로그는 폭탄 돌리기의 "마지막으로 터진 사람" 패턴과 동일** —
  `lastCardEvent`를 다음 카드가 발동할 때까지 화면에 계속 보여준다.
- **점수는 콤보 없이 난이도 고정 배점**(`difficulty * 10`) — 카드가 이미
  강한 운 요소를 담당하므로 콤보까지 겹치지 않게 했다.

## 한 일

- `games/chanceCard/` 신규: `types.ts`, `useChanceCardEngine.ts`
  (`SUBMIT_ANSWER`/`RESOLVE_STEAL`/`END_GAME_MANUALLY`/`ADJUST_SCORE`),
  `ChanceCardSetup.tsx`(`TerritorySetup.tsx` 기반, 팀 전용·최소 2팀 검증,
  점수 훔치기 액수 입력, 문항 필터 저장/복원), `ChanceCardPlay.tsx`
  (`territory/QuestionJudgePrompt` 재사용, 훔치기 대상 선택 패널, 팀별
  방어막 보유 표시).
- `shared/types/session.ts`, `SessionHistory.tsx`, `gameModeCatalog.tsx`
  (카드+별 모양 아이콘, `category:'team'`), `GameSelect.tsx`에 새 플로우
  단계 연결.

## 검증 결과

- `npm run typecheck` 통과.
- 리듀서를 `tsx`로 직접 실행(`Math.random`을 모킹해 카드 종류를 결정론적으로
  고정, 임시 export 후 삭제): 오답 시 카드 없이 턴만 이동, 정답 시 난이도
  배점 획득, 훔치기 카드 시 대상 선택 대기(턴 미이동)·대기 중 새 판정
  무시, 훔치기 해결(대상 점수 클램프, 대상에 방어막 있으면 차단 후 소비),
  순서 뒤집기 카드의 정확한 다음 팀 계산, 방어막 부여, 문제 큐 소진 시
  종료, 수동 종료·점수 수정, 종료 후 액션 무시 — 총 25개 케이스 확인.
- 브라우저로(fixture mock 디버그 하네스, 3팀) 실제 플레이: 순서 뒤집기·
  방어막 카드가 실제로 발동해 화면에 로그와 팀 상태(방어막 표시)가
  정확히 반영되는지 확인. `window.sessions.save` 호출을 가로채
  `gameMode: "chanceCard"`와 정확한 `finalScores`/`answers` 확인.
- 최종 `npm run dev`(Electron) 재부팅: 에러 없이 정상 기동 확인.

## 다음 단계

사용자가 지정한 6~8순위(카드 매칭·골든벨 서바이벌·찬스카드)를 모두 완료했다.
남은 9~10순위(모자이크 공개·분류 드래그)는 각각 이미지 업로드 인프라·새
문항 스키마라는 더 큰 선행 작업이 필요해([23번](23-remaining-game-modes-plan.md)
참고), 사용자 지시가 있을 때 범위를 다시 좁혀 진행한다.
