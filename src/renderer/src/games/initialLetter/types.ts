// 초성 퀴즈는 타임어택과 엔진이 완전히 동일하다(점수 계산·턴 진행·시간 제한 모두 동일) —
// 다른 건 "무엇을 문제 프롬프트로 보여주는가"뿐이라, 상태/설정 타입도 그대로 재노출한다.
export type {
  TimeAttackConfig as InitialLetterConfig,
  TimeAttackMode as InitialLetterMode,
  TimeAttackState as InitialLetterState,
  ParticipantRuntimeState
} from '../timeAttack/types';
