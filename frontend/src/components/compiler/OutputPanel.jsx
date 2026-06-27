const OutputPanel = ({ result, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 13 }}>
        Running code...
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{
        padding: "12px 14px",
        color: "var(--text-muted)",
        fontSize: 13,
        fontFamily: "var(--font-mono)"
      }}>
        Output will appear here after you run your code
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 14px" }}>
      {result.success ? (
        <pre className="output-text">{result.output || "(no output)"}</pre>
      ) : (
        <>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--red)",
            marginBottom: 6
          }}>
            {result.verdict}
          </div>
          <pre className="output-text error-text">{result.error}</pre>
        </>
      )}
    </div>
  );
};

export default OutputPanel;