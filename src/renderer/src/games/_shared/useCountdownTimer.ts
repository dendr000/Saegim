import { useCallback, useEffect, useRef, useState } from 'react';

type UseCountdownTimerOptions = {
  onExpire?: () => void;
  // 이 값이 바뀔 때마다 타이머가 durationSeconds로 재시작된다 (핫시트 모드의 턴 전환용).
  // 값이 바뀌지 않으면 마운트 시 한 번만 시작된다 (동시 진행 모드의 전체 타이머용).
  resetKey?: unknown;
};

export function useCountdownTimer(durationSeconds: number, options: UseCountdownTimerOptions = {}) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const onExpireRef = useRef(options.onExpire);
  onExpireRef.current = options.onExpire;

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
    setIsRunning(true);
    // durationSeconds는 세션 중 바뀌지 않는다고 가정하고, resetKey 변화에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.resetKey]);

  useEffect(() => {
    if (!isRunning) return;
    if (remainingSeconds <= 0) {
      setIsRunning(false);
      onExpireRef.current?.();
      return;
    }
    const timeoutId = setTimeout(() => setRemainingSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [isRunning, remainingSeconds]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  // 교사 수동 개입용: 남은 시간을 설정된 제한시간으로 되돌리고 다시 흐르게 한다
  // (쉬는 시간을 줬거나, 다시 기회를 주고 싶을 때).
  const reset = useCallback(() => {
    setRemainingSeconds(durationSeconds);
    setIsRunning(true);
  }, [durationSeconds]);

  return { remainingSeconds, isRunning, pause, resume, reset };
}
