# 참가 단위: 학생 개인 / 모둠(팀) 선택

완료일: 2026-09-05

## 목표

여러 학급을 가르치다 보면 학생 이름을 일일이 기억 못 할 수 있다는 지적 — 개인전
게임(타임어택/초성퀴즈/힌트차감형/보스레이드)에서 참가자를 "학생 개인" 대신
학급 관리에서 이미 이름 붙여둔 모둠("1조", "호랑이 조" 등) 단위로도 참가시킬 수
있게 해달라는 요청.

## 설계 결정

- **새 데이터는 필요 없다** — `SchoolClass.teams`가 이미 임의 이름을 붙일 수 있는
  구조라(`TeamManager.tsx`), 개인전 게임이 참가자 소스로 `students` 대신 `teams`를
  선택할 수 있게만 하면 된다.
- **엔진은 전혀 안 건드림** — 네 게임 엔진 모두 `participants: {id, label}[]`라는
  범용 타입만 받고 있어서, id/label이 학생에서 왔는지 팀에서 왔는지 몰라도 된다
  (Answer 타입 통일과 같은 결의 설계 — 소스를 모르는 게 자연스럽게 이어짐).
- **네 Setup 화면에 똑같이 반복될 패턴이라 `games/_shared/ParticipantPicker.tsx`로
  뺐다** — "학생 개인/모둠" 라디오 + 체크박스 목록을 한 컴포넌트로 묶고,
  `participantOptionsFor(schoolClass, mode)` 헬퍼로 참가자 옵션 계산을 공유. (기존에
  비슷한 학생 검색 UI는 그대로 안 뺐었는데, 이번엔 4곳에 동일하게 반복될 게
  명확해서 처음부터 공유 컴포넌트로 만듦.)
- 모둠 모드인데 학급에 모둠이 하나도 없으면 안내 문구를 띄운다("학급 관리에서
  모둠을 먼저 만들어주세요").
- 학급을 바꾸거나 참가 단위를 전환하면 선택 목록이 그 시점 기준 "전체 선택"으로
  리셋된다(기존 학생 전체 선택 기본값과 동일한 동작을 모둠에도 그대로 적용).

## 한 일

- `games/_shared/ParticipantPicker.tsx`(신규) — 참가 단위 토글 + 체크박스 목록.
- `timeAttack/TimeAttackSetup.tsx`, `initialLetter/InitialLetterSetup.tsx`,
  `hintDeduction/HintDeductionSetup.tsx`, `bossRaid/BossRaidSetup.tsx` — 개별
  `selectedStudentIds`/`toggleStudent`/체크박스 블록을 `ParticipantPicker`로 교체.

## 검증 결과

- `npm run typecheck` 통과.
- 브라우저로(fixture mock 디버그 하네스) 타임어택에서 확인: "학생 개인" 기본값으로
  학생 이름 목록이 뜨는지, "모둠(팀)"으로 전환 시 학급에 미리 만들어둔 "호랑이 조"/
  "독수리 조" 목록으로 바뀌는지, 그 상태로 게임을 시작하면 실제로 "지금 차례:
  호랑이 조"처럼 모둠 이름으로 진행되는지 확인.
- 최종 `npm run dev`(Electron) 재부팅은 다음 커밋과 함께 진행 예정(작업 흐름상
  아직 진행 중).

## 다음 단계

사용자가 이어서 문항 필터링(난이도별 선택, 시대/인물 등 주제별 필터) 부족을
지적함 — 별도로 범위를 정해 진행할 예정.
