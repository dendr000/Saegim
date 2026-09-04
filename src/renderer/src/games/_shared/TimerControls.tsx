type TimerControlsProps = {
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
};

// 교사 수동 개입: 시간제한이 있는 게임 화면이면 어디서든 재사용한다(_shared 소속인 이유).
// 쉬는 시간을 줄 때는 일시정지/재개, 다시 기회를 줄 때는 리셋으로 남은 시간을 되돌린다.
function TimerControls({ isRunning, onPause, onResume, onReset }: TimerControlsProps) {
  return (
    <div className="button-row">
      {isRunning ? (
        <button type="button" className="stage-button stage-button-small" onClick={onPause}>
          일시정지
        </button>
      ) : (
        <button type="button" className="stage-button stage-button-small" onClick={onResume}>
          재개
        </button>
      )}
      <button type="button" className="stage-button stage-button-small" onClick={onReset}>
        시간 리셋
      </button>
    </div>
  );
}

export default TimerControls;
