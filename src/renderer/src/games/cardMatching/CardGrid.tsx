import type { CardInstance } from './types';

type CardGridProps = {
  cards: CardInstance[];
  flippedCardIds: string[];
  matchedQuestionIds: Set<string>;
  disabled: boolean;
  onFlip: (cardId: string) => void;
};

function CardGrid({ cards, flippedCardIds, matchedQuestionIds, disabled, onFlip }: CardGridProps) {
  const columns = Math.max(2, Math.ceil(Math.sqrt(cards.length)));

  return (
    <div className="bingo-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {cards.map((card) => {
        const isMatched = matchedQuestionIds.has(card.questionId);
        const isFlipped = flippedCardIds.includes(card.id);
        const faceUp = isMatched || isFlipped;

        return (
          <button
            key={card.id}
            type="button"
            className="bingo-cell"
            disabled={isMatched || isFlipped || disabled}
            onClick={() => onFlip(card.id)}
            style={{ opacity: isMatched ? 0.5 : 1 }}
          >
            {faceUp ? card.text : '?'}
          </button>
        );
      })}
    </div>
  );
}

export default CardGrid;
