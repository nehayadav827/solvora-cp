import { useState, useEffect } from "react";
import { getAllProblems } from "../api/problemApi";
import ProblemCard from "../components/problems/ProblemCard";
import ProblemFilters from "../components/problems/ProblemFilters";
import Pagination from "../components/common/Pagination";

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    difficulty: "",
    page: 1,
  });

  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError("");

      try {
        // Remove empty filters before sending
        const params = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        );

        const res = await getAllProblems(params);
        setProblems(res.data.problems);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load problems");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search input — wait 400ms after typing stops
    const timer = setTimeout(fetchProblems, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="problems-page">
      <h2>Problems</h2>

      <ProblemFilters filters={filters} onChange={setFilters} />

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading problems...</p>
      ) : problems.length === 0 ? (
        <p className="placeholder">No problems found</p>
      ) : (
        <div className="problem-list">
          {problems.map((problem) => (
            <ProblemCard key={problem._id} problem={problem} />
          ))}
        </div>
      )}

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onPageChange={(newPage) => setFilters({ ...filters, page: newPage })}
      />
    </div>
  );
};

export default Problems;