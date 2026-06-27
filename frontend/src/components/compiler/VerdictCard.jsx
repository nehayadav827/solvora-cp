const VERDICT_STYLES = {
  Accepted: { color: "#0F7B0F", bg: "#E6F4EA" },
  "Wrong Answer": { color: "#9B1C1C", bg: "#FDE8E8" },
  "Time Limit Exceeded": { color: "#C05600", bg: "#FFF3E0" },
  "Runtime Error": { color: "#9B1C1C", bg: "#FDE8E8" },
  "Compile Error": { color: "#9B1C1C", bg: "#FDE8E8" },
  Pending: { color: "#444", bg: "#F5F5F5" },
};

const VerdictCard = ({ submission }) => {
  if (!submission) return null;

  const style = VERDICT_STYLES[submission.verdict] || VERDICT_STYLES.Pending;

  return (
    <div
      className="verdict-card"
      style={{ background: style.bg, borderLeft: `4px solid ${style.color}` }}
    >
      <div className="verdict-title" style={{ color: style.color }}>
        {submission.verdict}
      </div>

      <div className="verdict-stats">
        <span>
          Test Cases: {submission.testCasesPassed} / {submission.totalTestCases}
        </span>
        {submission.runtime > 0 && (
          <span>Runtime: {submission.runtime}ms</span>
        )}
        <span>Language: {submission.language}</span>
      </div>

      {submission.errorMessage && (
        <pre className="verdict-error">{submission.errorMessage}</pre>
      )}
    </div>
  );
};

export default VerdictCard;