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
import type { ParticipantScore } from '../../games/_shared/types';
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
  | { step: 'result'; scores: ParticipantScore[] };

function GameSelect({ onBack }: GameSelectProps) {
  const [flow, setFlow] = useState<FlowState>({ step: 'select' });

  if (flow.step === 'timeAttackSetup') {
    return (
      <TimeAttackSetup
        onStart={(config) => setFlow({ step: 'timeAttackPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'timeAttackPlaying') {
    return <TimeAttackPlay config={flow.config} onFinish={(scores) => setFlow({ step: 'result', scores })} />;
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
    return <TerritoryPlay config={flow.config} onFinish={(scores) => setFlow({ step: 'result', scores })} />;
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
    return <BettingPlay config={flow.config} onFinish={(scores) => setFlow({ step: 'result', scores })} />;
  }

  if (flow.step === 'result') {
    return <Result scores={flow.scores} onDone={() => setFlow({ step: 'select' })} />;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <button type="button" onClick={onBack}>
        ← 홈
      </button>
      <h1>게임 선택</h1>
      <button
        type="button"
        onClick={() => setFlow({ step: 'timeAttackSetup' })}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
      >
        타임어택 콤보
      </button>{' '}
      <button
        type="button"
        onClick={() => setFlow({ step: 'territorySetup' })}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
      >
        땅따먹기
      </button>{' '}
      <button
        type="button"
        onClick={() => setFlow({ step: 'bettingSetup' })}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
      >
        베팅형
      </button>
    </div>
  );
}

export default GameSelect;
