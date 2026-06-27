import { useState, useEffect } from "react";
import { getAllProblems } from "../api/problemApi";
import ProblemCard from "../components/problems/ProblemCard";
import ProblemFilters from "../components/problems/ProblemFilters";
import Pagination from "../components/common/Pagination";

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", difficulty: "", page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError("");
      try {
        const params = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        );
        const res = await getAllProblems(params);
        setProblems(res.data.problems);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load problems");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProblems, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="problems-page">
      <div className="page-header">
        <h2>Problems</h2>
        <p>{total} problems available</p>
      </div>

      <ProblemFilters filters={filters} onChange={setFilters} />

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="placeholder">Loading problems...</div>
      ) : problems.length === 0 ? (
        <div className="placeholder">
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div>No problems found</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Try adjusting your filters
          </div>
        </div>
      ) : (
        <>
          <div className="problem-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Difficulty</span>
            <span>Tags</span>
          </div>
          <div className="problem-list">
            {problems.map((problem, idx) => (
              <ProblemCard
                key={problem._id}
                problem={problem}
                index={(filters.page - 1) * 20 + idx}
              />
            ))}
          </div>
        </>
      )}

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
      />
    </div>
  );
};

export default Problems;