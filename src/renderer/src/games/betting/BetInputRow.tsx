import type { BettingTeamState } from './types';

type BetInputRowProps = {
  team: BettingTeamState;
  bet: number;
  onChange: (amount: number) => void;
};

function BetInputRow({ team, bet, onChange }: BetInputRowProps) {
  const maxBet = Math.max(0, team.score);

  return (
    <div className="stage-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
      <span style={{ minWidth: '7rem' }}>{team.label}</span>
      <span>보유 {team.score}점</span>
      <input
        type="number"
        min={0}
        max={maxBet}
        value={bet}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '7rem' }}
      />
      <span>점 배팅 (최대 {maxBet})</span>
    </div>
  );
}

export default BetInputRow;
