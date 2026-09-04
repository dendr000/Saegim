# 초성 퀴즈 (향후 게임 1순위 구현)

완료일: 2026-09-04

## 목표

CLAUDE.md "향후 추가"에 있던 게임 모드 10개 중 제작 난이도로 우선순위를 매기고,
가장 쉬운 것부터 구현. 우선순위 랭킹과 설계 결정은 계획 단계에서 사용자 승인을 받았다.

## 우선순위 랭킹 (쉬움 → 어려움)

1. **초성 퀴즈** — 이번에 구현
2. 힌트 차감형 — 타임어택과 거의 동일, 힌트 열람 시 점수 차감 로직만 추가
3. 보스 레이드(협동형) — 타임어택 동시 진행 + 공유 HP
4. 문제 빙고 — 땅따먹기 변형(격자 + 빙고 줄 보너스), [doc/ideas.md](ideas.md)의
   땅따먹기 격자 아이디어와 겹침
5. 폭탄 돌리기 — 숨겨진 무작위 타이머 + 턴 넘기기
6. 카드 매칭 — 새 상호작용(카드 뒤집기)이지만 상태는 단순
7. 골든벨 서바이벌 — 전원 정오답 체크리스트 UI 필요
8. 찬스카드 — 여러 게임을 가로지르는 효과 시스템 필요
9. 모자이크 공개 — `imageIdentify` CRUD/CSV·이미지 업로드부터 새로 필요
10. 분류 드래그 — 드래그 앤 드롭 + 새 문항 스키마, 가장 큼

## 설계 결정

- **새 문항 타입을 만들지 않았다.** 기존 단답형(`shortAnswer`) 문항의 `payload.answer`에서
  초성만 추출해 보여준다 — 문제은행 CRUD/CSV는 그대로.
- **질문 텍스트는 보여주지 않고 초성만 보여준다.** 대신 `era`/`unit`(시대/단원)을 작은
  힌트로 같이 표시 — 새 데이터 없이 기존 필드 재활용. "초성만 보고 맞히기 + 교사가
  구두로 추가 힌트"라는, 실제 초성 퀴즈 방식에 가장 가까운 조합으로 판단해 이렇게 정함.
- **엔진을 복제하지 않고 타임어택 엔진을 그대로 재사용했다.** 점수 계산·턴 진행·시간
  제한이 완전히 동일하므로 `useTimeAttackEngine`을 `initialLetter/InitialLetterPlay.tsx`에서
  그대로 import — 다른 리듀서를 새로 만들지 않아 유지보수 포인트가 늘지 않는다. 실제로
  다른 부분은 "무엇을 프롬프트로 보여주는가"뿐이라 그 부분만 담당하는 화면 컴포넌트만
  새로 만들었다.
- Setup에서 문제 필터링 시 단답형만 골라 쓴다 — 객관식은 보기가 화면에 이미 다 보여서
  초성으로 맞히는 게임이 성립하지 않기 때문.

## 한 일

- `games/initialLetter/initials.ts` — `extractInitials(text)`. 한글 음절 유니코드
  오프셋으로 초성 자모를 뽑는 순수 함수. 한글이 아닌 문자(공백·숫자·영문)는 그대로 통과.
- `games/initialLetter/types.ts` — `TimeAttackConfig`/`TimeAttackState` 등을
  `InitialLetterConfig`/`InitialLetterState` 이름으로 재노출.
- `games/initialLetter/HotSeatInitialsControls.tsx`,
  `SimultaneousInitialsControls.tsx` — 타임어택의 두 Controls를 기반으로, 프롬프트
  표시 줄만 초성 + 시대/단원 힌트로 교체. 판정 로직은 동일.
- `games/initialLetter/InitialLetterSetup.tsx` — 타임어택 설정 화면 기반, 문제 필터를
  단답형으로 제한.
- `games/initialLetter/InitialLetterPlay.tsx` — `useTimeAttackEngine`을 그대로 사용,
  위 Controls로 화면 조립.
- `shared/types/session.ts`의 `GameMode`에 `'initialLetter'` 추가,
  `SessionHistory.tsx`의 `GAME_MODE_LABELS`에 `'초성 퀴즈'` 추가.
- `pages/GameSelect/GameSelect.tsx`에 새 플로우 단계와 "초성 퀴즈" 버튼 추가 —
  기존 세 게임과 완전히 같은 패턴.

## 검증 결과

- `npm run typecheck` 통과.
- `extractInitials()`를 `tsx`로 직접 실행해 7개 케이스 검증(기본 단어, 여러 음절,
  공백 포함, 숫자만, 숫자+한글 혼합, 빈 문자열, 영문+한글 혼합) 후 원복.
- Electron 없이 브라우저로 실제 클릭 재현(fixture mock 디버그 하네스): 홈 → 게임
  시작 → 초성 퀴즈 → 학급 선택(단답형 문제만 개수 표시 확인) → 시작 → 초성 프롬프트
  + 시대/단원 힌트 표시 확인 → 정답/오답 처리 시 점수·턴 정상 진행 → 게임 종료 후
  결과 화면 → 세션 기록에 "초성 퀴즈"로 저장되고 오답 통계에도 정상 반영됨을 확인.
- 확인 후 `main.tsx` 원복, 잔여 프로세스 정리.
- 최종 `npm run dev`(Electron)로 재부팅 확인.

## 확인해 주세요

1. 학급에 단답형 문제가 있는 상태로 홈 → 게임 시작 → 초성 퀴즈로 플레이.
2. 프롬프트로 초성만 뜨고 질문 텍스트는 안 보이는지, 시대/단원 힌트가 화면에
   같이 보이는지 확인.
3. 점수·콤보 계산이 타임어택과 동일하게 동작하는지(난이도×콤보단계).
4. 세션 기록에서 "초성 퀴즈"로 구분돼 남는지.

## 다음 단계

랭킹 2순위 힌트 차감형, 3순위 보스 레이드가 다음 후보. 착수 전에 CLAUDE.md 규칙대로
계획을 먼저 제시하고 확인받을 것.
