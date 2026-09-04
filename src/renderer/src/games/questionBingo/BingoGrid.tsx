import type { BingoCell } from './types';

type BingoGridProps = {
  cells: BingoCell[];
  gridSize: number;
  cellOwners: Record<string, string | null>;
  teamColors: Record<string, string>;
  pendingCellId: string | null;
  onCellClick: (cellId: string) => void;
};

function BingoGrid({ cells, gridSize, cellOwners, teamColors, pendingCellId, onCellClick }: BingoGridProps) {
  return (
    <div className="bingo-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
      {cells.map((cell) => {
        const ownerTeamId = cellOwners[cell.id];
        const isPending = cell.id === pendingCellId;
        return (
          <button
            key={cell.id}
            type="button"
            className="bingo-cell"
            disabled={ownerTeamId !== null || isPending}
            onClick={() => onCellClick(cell.id)}
            style={{
              backgroundColor: ownerTeamId ? teamColors[ownerTeamId] : undefined,
              opacity: isPending ? 0.5 : 1
            }}
          >
            {ownerTeamId ? '' : `난이도 ${cell.difficulty}`}
          </button>
        );
      })}
    </div>
  );
}

export default BingoGrid;
