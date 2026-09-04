type AnswerRevealProps = {
  correct: boolean;
  answerText: string;
};

function AnswerReveal({ correct, answerText }: AnswerRevealProps) {
  return (
    <div className={`stage-answer-reveal ${correct ? 'is-correct' : 'is-wrong'}`}>
      {correct ? '정답!' : '오답'} — {answerText}
    </div>
  );
}

export default AnswerReveal;
