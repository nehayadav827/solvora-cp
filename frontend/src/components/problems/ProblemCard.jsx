import { Link } from "react-router-dom";
import { DIFFICULTY_COLORS } from "../../constants/difficulty";

const ProblemCard = ({ problem }) => {
  return (
    <Link to={`/problems/${problem.slug}`} className="problem-card">
      <div className="problem-card-main">
        <span className="problem-title">{problem.title}</span>
        <div className="problem-tags">
          {problem.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <span
        className="difficulty-badge"
        style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}
      >
        {problem.difficulty}
      </span>
    </Link>
  );
};

export default ProblemCard;