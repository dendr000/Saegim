# 타이머 일시정지·재개·리셋 (교사 수동 개입)

완료일: 2026-09-04

## 목표

수업 중 잠깐 쉬거나, 방해가 있어 멈춰야 하거나, 학생에게 다시 기회를 주고 싶을 때
교사가 남은 시간을 직접 조작할 수 있게 해달라는 요청. 시간제한이 있는 게임(타임어택
콤보, 초성 퀴즈 — 둘 다 같은 엔진을 씀)에 적용된다. 땅따먹기·베팅형은 애초에
카운트다운 타이머가 없어 대상이 아니다.

## 설계 결정

- **`games/_shared/useCountdownTimer.ts`에만 로직을 추가했다.** 이 훅은 이미
  단일 책임으로 분리되어 있어(어느 게임인지 모름), `reset()` 하나만 추가하면
  지금 이 훅을 쓰는 모든 게임(현재: 타임어택, 그리고 같은 엔진을 재사용하는
  초성 퀴즈)과 나중에 시간제한을 쓸 게임(힌트 차감형, 폭탄 돌리기 등)이 전부
  자동으로 이 기능을 갖게 된다 — 게임마다 따로 구현할 필요 없음.
- `pause`/`resume`은 이미 훅에 있었지만 아무도 안 쓰고 있었다. `useTimeAttackEngine`이
  이를 `isTimerRunning`/`pauseTimer`/`resumeTimer`/`resetTimer`로 다시 노출하도록만
  바꿨다.
- **일시정지/재개와 리셋을 하나로 합치지 않고 분리했다** — 잠깐 멈췄다 이어가는 것과
  아예 처음부터 다시 주는 것은 의도가 다르다. 리셋은 항상 제한시간 그대로 채우고
  다시 흐르게 한다(멈춰있었다면 같이 재개됨).
- 버튼 UI(`TimerControls.tsx`)도 `games/_shared/`에 새로 만들어 타임어택·초성 퀴즈
  화면이 그대로 가져다 쓴다 — 게임마다 똑같은 버튼을 두 번 만들지 않기 위함.

## 한 일

- `games/_shared/useCountdownTimer.ts` — `reset()` 추가(남은 시간을 `durationSeconds`로
  되돌리고 다시 흐르게 함).
- `games/_shared/TimerControls.tsx`(신규) — 일시정지/재개 토글 버튼 + 시간 리셋 버튼.
- `games/timeAttack/useTimeAttackEngine.ts` — `isTimerRunning`/`pauseTimer`/
  `resumeTimer`/`resetTimer`를 반환값에 추가.
- `games/timeAttack/TimeAttackPlay.tsx`, `games/initialLetter/InitialLetterPlay.tsx` —
  타이머 표시 바로 아래에 `<TimerControls />` 추가.

## 검증 결과

- `npm run typecheck` 통과.
- 브라우저로 실제 클릭 재현(fixture mock 디버그 하네스): 타임어택에서 "일시정지" →
  2.5초 기다려도 남은 시간이 그대로인 것 확인 → "재개" → 다시 줄어드는 것 확인 →
  "시간 리셋" → 53초에서 60초(설정한 제한시간)로 정확히 복귀하는 것 확인.
- 초성 퀴즈에서도 같은 버튼이 코드 추가 없이 그대로 나타나는 것을 확인 —
  `useTimeAttackEngine` 재사용 설계가 의도대로 동작함을 실증.
- 최종 `npm run dev`(Electron)로 재부팅 확인.

## 다음 단계

랭킹 2순위(힌트 차감형)·3순위(보스 레이드) 대기 중.
