import { useState } from 'react';
import TimeAttackSetup from '../../games/timeAttack/TimeAttackSetup';
import TimeAttackPlay from '../../games/timeAttack/TimeAttackPlay';
import type { TimeAttackConfig } from '../../games/timeAttack/types';
import TerritorySetup from '../../games/territory/TerritorySetup';
import TerritoryPlay from '../../games/territory/TerritoryPlay';
import type { TerritoryConfig } from '../../games/territory/types';
import BettingSetup from '../../games/betting/BettingSetup';
import BettingPlay from '../../games/betting/BettingPlay';
import type { BettingConfig } from '../../games/betting/types';
import InitialLetterSetup from '../../games/initialLetter/InitialLetterSetup';
import InitialLetterPlay from '../../games/initialLetter/InitialLetterPlay';
import type { InitialLetterConfig } from '../../games/initialLetter/types';
import type { GameFinishPayload, ParticipantScore } from '../../games/_shared/types';
import type { GameMode } from '../../../../shared/types/session';
import Result from '../Result/Result';

type GameSelectProps = {
  onBack: () => void;
};

type FlowState =
  | { step: 'select' }
  | { step: 'timeAttackSetup' }
  | { step: 'timeAttackPlaying'; config: TimeAttackConfig }
  | { step: 'territorySetup' }
  | { step: 'territoryPlaying'; config: TerritoryConfig }
  | { step: 'bettingSetup' }
  | { step: 'bettingPlaying'; config: BettingConfig }
  | { step: 'initialLetterSetup' }
  | { step: 'initialLetterPlaying'; config: InitialLetterConfig }
  | { step: 'result'; scores: ParticipantScore[] };

function GameSelect({ onBack }: GameSelectProps) {
  const [flow, setFlow] = useState<FlowState>({ step: 'select' });

  // 게임이 끝나면 학급 정보 + 게임 종류 + 결과를 묶어 세션으로 저장한 뒤 결과 화면으로 넘어간다.
  async function handleFinish(
    gameMode: GameMode,
    classId: string,
    className: string,
    result: GameFinishPayload
  ): Promise<void> {
    await window.sessions.save({
      classId,
      className,
      gameMode,
      playedAt: Date.now(),
      finalScores: result.scores.map((score) => ({ participantId: score.id, label: score.label, score: score.score })),
      answers: result.answers
    });
    setFlow({ step: 'result', scores: result.scores });
  }

  if (flow.step === 'timeAttackSetup') {
    return (
      <TimeAttackSetup
        onStart={(config) => setFlow({ step: 'timeAttackPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'timeAttackPlaying') {
    return (
      <TimeAttackPlay
        config={flow.config}
        onFinish={(result) => handleFinish('timeAttack', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'territorySetup') {
    return (
      <TerritorySetup
        onStart={(config) => setFlow({ step: 'territoryPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'territoryPlaying') {
    return (
      <TerritoryPlay
        config={flow.config}
        onFinish={(result) => handleFinish('territory', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'bettingSetup') {
    return (
      <BettingSetup
        onStart={(config) => setFlow({ step: 'bettingPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'bettingPlaying') {
    return (
      <BettingPlay
        config={flow.config}
        onFinish={(result) => handleFinish('betting', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'initialLetterSetup') {
    return (
      <InitialLetterSetup
        onStart={(config) => setFlow({ step: 'initialLetterPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'initialLetterPlaying') {
    return (
      <InitialLetterPlay
        config={flow.config}
        onFinish={(result) => handleFinish('initialLetter', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'result') {
    return <Result scores={flow.scores} onDone={() => setFlow({ step: 'select' })} />;
  }

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onBack}>
        ← 홈
      </button>
      <h1>게임 선택</h1>
      <div className="button-row">
        <button type="button" className="button-primary" onClick={() => setFlow({ step: 'timeAttackSetup' })}>
          타임어택 콤보
        </button>
        <button type="button" className="button-primary" onClick={() => setFlow({ step: 'territorySetup' })}>
          땅따먹기
        </button>
        <button type="button" className="button-primary" onClick={() => setFlow({ step: 'bettingSetup' })}>
          베팅형
        </button>
        <button type="button" className="button-primary" onClick={() => setFlow({ step: 'initialLetterSetup' })}>
          초성 퀴즈
        </button>
      </div>
    </div>
  );
}

export default GameSelect;
