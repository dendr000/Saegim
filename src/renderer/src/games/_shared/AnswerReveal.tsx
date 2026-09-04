type AnswerRevealProps = {
  correct: boolean;
  answerText: string;
};

function AnswerReveal({ correct, answerText }: AnswerRevealProps) {
  return (
    <div
      style={{
        padding: '1rem',
        margin: '0.5rem 0',
        borderRadius: '0.5rem',
        color: '#fff',
        backgroundColor: correct ? '#2e7d32' : '#c62828',
        fontSize: '1.25rem',
        fontWeight: 'bold'
      }}
    >
      {correct ? '정답!' : '오답'} — {answerText}
    </div>
  );
}

export default AnswerReveal;
