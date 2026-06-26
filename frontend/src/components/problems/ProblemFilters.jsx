const ProblemFilters = ({ filters, onChange }) => {
  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  return (
    <div className="problem-filters">
      <input
        type="text"
        name="search"
        placeholder="Search problems..."
        value={filters.search}
        onChange={handleChange}
        className="search-input"
      />

      <select name="difficulty" value={filters.difficulty} onChange={handleChange}>
        <option value="">All Difficulties</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
    </div>
  );
};

export default ProblemFilters;