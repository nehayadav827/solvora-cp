import { Link } from "react-router-dom";

const DIFFICULTY_CLASS = {
  Easy: "badge-easy",
  Medium: "badge-medium",
  Hard: "badge-hard",
};

const ProblemCard = ({ problem, index }) => {
  return (
    <Link to={`/problems/${problem.slug}`} className="problem-card">
      <span className="problem-number">{index + 1}</span>

      <div className="problem-card-main">
        <span className="problem-title">{problem.title}</span>
        <div className="problem-tags">
          {problem.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      <span className={`difficulty-badge badge ${DIFFICULTY_CLASS[problem.difficulty]}`}>
        {problem.difficulty}
      </span>

      <span /> {/* placeholder for 4th column on desktop */}
    </Link>
  );
};

export default ProblemCard;