import { useMemo, useState } from 'react';
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
import HintDeductionSetup from '../../games/hintDeduction/HintDeductionSetup';
import HintDeductionPlay from '../../games/hintDeduction/HintDeductionPlay';
import type { HintDeductionConfig } from '../../games/hintDeduction/types';
import BossRaidSetup from '../../games/bossRaid/BossRaidSetup';
import BossRaidPlay from '../../games/bossRaid/BossRaidPlay';
import type { BossRaidConfig } from '../../games/bossRaid/types';
import QuestionBingoSetup from '../../games/questionBingo/QuestionBingoSetup';
import QuestionBingoPlay from '../../games/questionBingo/QuestionBingoPlay';
import type { QuestionBingoConfig } from '../../games/questionBingo/types';
import BombPassSetup from '../../games/bombPass/BombPassSetup';
import BombPassPlay from '../../games/bombPass/BombPassPlay';
import type { BombPassConfig } from '../../games/bombPass/types';
import CardMatchingSetup from '../../games/cardMatching/CardMatchingSetup';
import CardMatchingPlay from '../../games/cardMatching/CardMatchingPlay';
import type { CardMatchingConfig } from '../../games/cardMatching/types';
import type { GameFinishPayload, ParticipantScore } from '../../games/_shared/types';
import type { GameMode } from '../../../../shared/types/session';
import Result from '../Result/Result';
import { GAME_MODE_CATALOG, GAME_MODE_CATEGORY_LABELS, type GameModeCategory } from './gameModeCatalog';

type GameSelectProps = {
  onBack: () => void;
};

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  );
}

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
  | { step: 'hintDeductionSetup' }
  | { step: 'hintDeductionPlaying'; config: HintDeductionConfig }
  | { step: 'bossRaidSetup' }
  | { step: 'bossRaidPlaying'; config: BossRaidConfig }
  | { step: 'questionBingoSetup' }
  | { step: 'questionBingoPlaying'; config: QuestionBingoConfig }
  | { step: 'bombPassSetup' }
  | { step: 'bombPassPlaying'; config: BombPassConfig }
  | { step: 'cardMatchingSetup' }
  | { step: 'cardMatchingPlaying'; config: CardMatchingConfig }
  | { step: 'result'; scores: ParticipantScore[] };

function GameSelect({ onBack }: GameSelectProps) {
  const [flow, setFlow] = useState<FlowState>({ step: 'select' });
  const [searchText, setSearchText] = useState('');

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredCatalog = useMemo(() => {
    if (!normalizedSearch) return GAME_MODE_CATALOG;
    return GAME_MODE_CATALOG.filter(
      (entry) =>
        entry.title.toLowerCase().includes(normalizedSearch) ||
        entry.description.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const categorizedEntries = useMemo(() => {
    const categories: GameModeCategory[] = ['solo', 'team', 'concept'];
    return categories
      .map((category) => ({
        category,
        entries: filteredCatalog.filter((entry) => entry.category === category)
      }))
      .filter((group) => group.entries.length > 0);
  }, [filteredCatalog]);

  function handleSelectMode(id: GameMode): void {
    if (id === 'timeAttack') setFlow({ step: 'timeAttackSetup' });
    else if (id === 'territory') setFlow({ step: 'territorySetup' });
    else if (id === 'betting') setFlow({ step: 'bettingSetup' });
    else if (id === 'initialLetter') setFlow({ step: 'initialLetterSetup' });
    else if (id === 'hintDeduction') setFlow({ step: 'hintDeductionSetup' });
    else if (id === 'bossRaid') setFlow({ step: 'bossRaidSetup' });
    else if (id === 'questionBingo') setFlow({ step: 'questionBingoSetup' });
    else if (id === 'bombPass') setFlow({ step: 'bombPassSetup' });
    else if (id === 'cardMatching') setFlow({ step: 'cardMatchingSetup' });
  }

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

  if (flow.step === 'hintDeductionSetup') {
    return (
      <HintDeductionSetup
        onStart={(config) => setFlow({ step: 'hintDeductionPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'hintDeductionPlaying') {
    return (
      <HintDeductionPlay
        config={flow.config}
        onFinish={(result) => handleFinish('hintDeduction', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'bossRaidSetup') {
    return (
      <BossRaidSetup
        onStart={(config) => setFlow({ step: 'bossRaidPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'bossRaidPlaying') {
    return (
      <BossRaidPlay
        config={flow.config}
        onFinish={(result) => handleFinish('bossRaid', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'questionBingoSetup') {
    return (
      <QuestionBingoSetup
        onStart={(config) => setFlow({ step: 'questionBingoPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'questionBingoPlaying') {
    return (
      <QuestionBingoPlay
        config={flow.config}
        onFinish={(result) => handleFinish('questionBingo', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'bombPassSetup') {
    return (
      <BombPassSetup
        onStart={(config) => setFlow({ step: 'bombPassPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'bombPassPlaying') {
    return (
      <BombPassPlay
        config={flow.config}
        onFinish={(result) => handleFinish('bombPass', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'cardMatchingSetup') {
    return (
      <CardMatchingSetup
        onStart={(config) => setFlow({ step: 'cardMatchingPlaying', config })}
        onCancel={() => setFlow({ step: 'select' })}
      />
    );
  }

  if (flow.step === 'cardMatchingPlaying') {
    return (
      <CardMatchingPlay
        config={flow.config}
        onFinish={(result) => handleFinish('cardMatching', flow.config.classId, flow.config.className, result)}
      />
    );
  }

  if (flow.step === 'result') {
    return <Result scores={flow.scores} onDone={() => setFlow({ step: 'select' })} />;
  }

  return (
    <div className="page">
      <button type="button" className="page-back icon-button" onClick={onBack}>
        <BackArrowIcon /> 홈
      </button>
      <h1>게임 선택</h1>
      <p className="muted-text">학급에 맞는 게임 모드를 골라주세요.</p>

      <div className="mode-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="게임 이름이나 설명으로 검색"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {categorizedEntries.length === 0 ? (
        <p className="mode-empty">일치하는 게임이 없습니다.</p>
      ) : (
        categorizedEntries.map(({ category, entries }) => (
          <div key={category} className="mode-section">
            <h2 className="mode-section-title">{GAME_MODE_CATEGORY_LABELS[category]}</h2>
            <div className="mode-grid">
              {entries.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  className="mode-card"
                  style={{ animationDelay: `${index * 0.06}s` }}
                  onClick={() => handleSelectMode(entry.id)}
                >
                  {entry.icon}
                  <span className="mode-card-title">{entry.title}</span>
                  <span className="mode-card-description">{entry.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default GameSelect;
