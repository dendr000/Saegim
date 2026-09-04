import type { Difficulty } from '../../../../shared/types/question';
import type { BingoCell } from './types';

// 게임 시작 시 한 번만 호출 — 칸마다 난이도를 무작위로 배정하고, 선택 전부터
// 화면에 보이도록 고정한다("문제 난이도를 칸에 미리 배치해서 보이게 함").
export function generateCells(gridSize: number): BingoCell[] {
  const cells: BingoCell[] = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const difficulty = (Math.floor(Math.random() * 3) + 1) as Difficulty;
      cells.push({ id: `cell-${row}-${col}`, row, col, difficulty });
    }
  }
  return cells;
}

export type BingoLine = { id: string; cellIds: string[] };

// 가로 gridSize줄 + 세로 gridSize줄 + 대각선 2줄. 홀수 격자라 대각선이 정확히
// 한 칸씩 겹치며 중앙을 지난다.
export function computeLines(gridSize: number): BingoLine[] {
  const lines: BingoLine[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    const cellIds = Array.from({ length: gridSize }, (_, col) => `cell-${row}-${col}`);
    lines.push({ id: `row-${row}`, cellIds });
  }
  for (let col = 0; col < gridSize; col += 1) {
    const cellIds = Array.from({ length: gridSize }, (_, row) => `cell-${row}-${col}`);
    lines.push({ id: `col-${col}`, cellIds });
  }
  lines.push({
    id: 'diag-main',
    cellIds: Array.from({ length: gridSize }, (_, i) => `cell-${i}-${i}`)
  });
  lines.push({
    id: 'diag-anti',
    cellIds: Array.from({ length: gridSize }, (_, i) => `cell-${i}-${gridSize - 1 - i}`)
  });

  return lines;
}

// 방금 칸을 점령한 teamId가 이번 점령으로 새로 완성한 줄만 골라낸다 — 이미 보너스를
// 받은 줄(alreadyCompleted)은 다시 잡지 않는다.
export function findNewCompletedLines(
  cellOwners: Record<string, string | null>,
  lines: BingoLine[],
  teamId: string,
  alreadyCompleted: string[]
): string[] {
  return lines
    .filter((line) => !alreadyCompleted.includes(line.id))
    .filter((line) => line.cellIds.every((cellId) => cellOwners[cellId] === teamId))
    .map((line) => line.id);
}
