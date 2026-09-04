import type { Question } from '../../../../shared/types/question';
import type { BettingTeamState } from './types';

type TeamAnswerRowProps = {
  team: BettingTeamState;
  bet: number;
  question: Question;
  selectedValue: unknown;
  onSelect: (value: unknown) => void;
};

function isSameChoice(selectedValue: unknown, index: number): boolean {
  return (
    typeof selectedValue === 'object' &&
    selectedValue !== null &&
    (selectedValue as { choiceIndex?: number }).choiceIndex === index
  );
}

function isJudged(selectedValue: unknown, judgedCorrect: boolean): boolean {
  return (
    typeof selectedValue === 'object' &&
    selectedValue !== null &&
    (selectedValue as { judgedCorrect?: boolean }).judgedCorrect === judgedCorrect
  );
}

function TeamAnswerRow({ team, bet, question, selectedValue, onSelect }: TeamAnswerRowProps) {
  return (
    <div className="stage-panel">
      <strong className="stage-text">
        {team.label} (배팅 {bet}점)
      </strong>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              className="stage-button"
              onClick={() => onSelect({ choiceIndex: index })}
              style={{
                fontWeight: isSameChoice(selectedValue, index) ? 'bold' : 'normal',
                outline: isSameChoice(selectedValue, index) ? '3px solid var(--stage-primary)' : undefined
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : question.type === 'shortAnswer' ? (
        <div>
          <button
            type="button"
            className="stage-button"
            onClick={() => onSelect({ judgedCorrect: true })}
            style={{
              fontWeight: isJudged(selectedValue, true) ? 'bold' : 'normal',
              outline: isJudged(selectedValue, true) ? '3px solid var(--color-correct)' : undefined
            }}
          >
            정답 처리
          </button>
          <button
            type="button"
            className="stage-button"
            onClick={() => onSelect({ judgedCorrect: false })}
            style={{
              fontWeight: isJudged(selectedValue, false) ? 'bold' : 'normal',
              outline: isJudged(selectedValue, false) ? '3px solid var(--color-wrong)' : undefined
            }}
          >
            오답 처리
          </button>
        </div>
      ) : (
        <p className="stage-text">이 유형은 아직 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default TeamAnswerRow;
