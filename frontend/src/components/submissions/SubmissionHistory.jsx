import { useEffect, useState } from "react";
import { getMySubmissions } from "../../api/submissionApi";

const VERDICT_COLORS = {
  Accepted: "#0F7B0F",
  "Wrong Answer": "#9B1C1C",
  "Time Limit Exceeded": "#C05600",
  "Runtime Error": "#9B1C1C",
  "Compile Error": "#9B1C1C",
  Pending: "#888",
};

const SubmissionHistory = ({ problemSlug }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMySubmissions(problemSlug);
        setSubmissions(res.data.submissions);
      } catch {
        // user not logged in — show nothing
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [problemSlug]);

  if (loading) return <p className="placeholder">Loading submissions...</p>;

  if (submissions.length === 0) {
    return <p className="placeholder">No submissions yet</p>;
  }

  return (
    <div className="submission-history">
      <h4>Your Submissions</h4>
      <table className="submission-table">
        <thead>
          <tr>
            <th>Verdict</th>
            <th>Language</th>
            <th>Passed</th>
            <th>Runtime</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s._id}>
              <td style={{ color: VERDICT_COLORS[s.verdict], fontWeight: 600 }}>
                {s.verdict}
              </td>
              <td>{s.language}</td>
              <td>
                {s.testCasesPassed}/{s.totalTestCases}
              </td>
              <td>{s.runtime > 0 ? `${s.runtime}ms` : "-"}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionHistory;