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
    <div style={{ border: '1px solid #ddd', padding: '0.5rem', marginBottom: '0.5rem' }}>
      <strong>
        {team.label} (배팅 {bet}점)
      </strong>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect({ choiceIndex: index })}
              style={{
                margin: '0.25rem',
                padding: '0.4rem 0.8rem',
                fontWeight: isSameChoice(selectedValue, index) ? 'bold' : 'normal',
                outline: isSameChoice(selectedValue, index) ? '2px solid #4285f4' : undefined
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
            onClick={() => onSelect({ judgedCorrect: true })}
            style={{
              margin: '0.25rem',
              padding: '0.4rem 0.8rem',
              fontWeight: isJudged(selectedValue, true) ? 'bold' : 'normal',
              outline: isJudged(selectedValue, true) ? '2px solid #34a853' : undefined
            }}
          >
            정답 처리
          </button>
          <button
            type="button"
            onClick={() => onSelect({ judgedCorrect: false })}
            style={{
              margin: '0.25rem',
              padding: '0.4rem 0.8rem',
              fontWeight: isJudged(selectedValue, false) ? 'bold' : 'normal',
              outline: isJudged(selectedValue, false) ? '2px solid #ea4335' : undefined
            }}
          >
            오답 처리
          </button>
        </div>
      ) : (
        <p>이 유형은 아직 지원하지 않습니다.</p>
      )}
    </div>
  );
}

export default TeamAnswerRow;
