import { useEffect, useState } from 'react';
import Scoreboard from '../_shared/Scoreboard';
import AnswerReveal from '../_shared/AnswerReveal';
import TimerControls from '../_shared/TimerControls';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useBossRaidEngine } from './useBossRaidEngine';
import BossRaidControls from './BossRaidControls';
import type { BossRaidConfig } from './types';

type BossRaidPlayProps = {
  config: BossRaidConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function BossRaidPlay({ config, onFinish }: BossRaidPlayProps) {
  const {
    state,
    remainingSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    submitAnswer,
    skipQuestion,
    endGame,
    adjustBossHp
  } = useBossRaidEngine(config);
  const [hpDraft, setHpDraft] = useState('');

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish({
        scores: state.participants.map((participant) => ({
          id: participant.id,
          label: participant.label,
          score: participant.score
        })),
        answers: state.answerHistory
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastResult) return;
    if (state.lastResult.correct) playCorrectSound();
    else playWrongSound();
  }, [state.lastResult]);

  if (state.status === 'finished') {
    return (
      <div className="stage">
        <p className="stage-text">결과 화면으로 이동 중...</p>
      </div>
    );
  }

  const hpPercent = Math.round((state.bossHp / config.bossMaxHp) * 100);

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">보스 레이드</h1>
        <p className="stage-timer">남은 시간: {remainingSeconds}초</p>
        <TimerControls isRunning={isTimerRunning} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} />

        <p className="stage-subtitle">
          {config.bossName} — 체력 {state.bossHp} / {config.bossMaxHp}
        </p>
        <div className="stage-hp-bar">
          <div className="stage-hp-bar-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <p className="stage-text stage-muted">현재 협동 콤보: {state.combo}연속 정답</p>

        {state.lastResult && (
          <AnswerReveal correct={state.lastResult.correct} answerText={state.lastResult.answerText} />
        )}

        {state.currentQuestion && (
          <BossRaidControls
            key={state.currentQuestion.id}
            question={state.currentQuestion}
            participants={state.participants}
            onSubmit={(participantId, value) => submitAnswer(value, participantId)}
            onSkip={skipQuestion}
            onEndGame={endGame}
          />
        )}

        <h3 className="stage-subtitle">기여도</h3>
        <Scoreboard
          entries={state.participants.map((participant) => ({
            id: participant.id,
            label: participant.label,
            score: participant.score
          }))}
        />

        <div className="stage-panel">
          <strong className="stage-text">보스 체력 수동 조정 (판정 실수 등을 바로잡을 때)</strong>
          <div className="button-row" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            <input
              type="number"
              min={0}
              max={config.bossMaxHp}
              placeholder={String(state.bossHp)}
              value={hpDraft}
              onChange={(event) => setHpDraft(event.target.value)}
              style={{ width: '6rem' }}
            />
            <button
              type="button"
              className="stage-button stage-button-small"
              onClick={() => {
                const parsed = Number(hpDraft);
                if (!Number.isNaN(parsed) && hpDraft.trim() !== '') {
                  adjustBossHp(parsed);
                  setHpDraft('');
                }
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BossRaidPlay;
