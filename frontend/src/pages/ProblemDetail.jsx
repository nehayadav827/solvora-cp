import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProblemBySlug } from "../api/problemApi";
import { runCode } from "../api/compilerApi";
import ProblemStatement from "../components/problems/ProblemStatement";
import CodeEditor from "../components/compiler/CodeEditor";
import LanguageSelector from "../components/compiler/LanguageSelector";
import OutputPanel from "../components/compiler/OutputPanel";
import { DEFAULT_CODE } from "../constants/languages";

const ProblemDetail = () => {
  const { slug } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getProblemBySlug(slug);
        setProblem(res.data.problem);

        // Pre-fill input with the first example's input, if available
        if (res.data.problem.examples?.length > 0) {
          setInput(res.data.problem.examples[0].input);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Problem not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [slug]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setResult(null);
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await runCode({ language, code, input });
      setResult(res.data);
    } catch (err) {
      setResult({
        success: false,
        verdict: "Error",
        error: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit will be wired to the submission system in the next step ──
  const handleSubmit = () => {
    alert("Submission system coming next — this will run against hidden test cases");
  };

  if (loading) return <p className="placeholder">Loading problem...</p>;

  if (error) {
    return (
      <div className="problem-detail-error">
        <p className="error">{error}</p>
        <Link to="/problems">← Back to Problems</Link>
      </div>
    );
  }

  return (
    <div className="problem-detail-page">
      <div className="problem-detail-left">
        <ProblemStatement problem={problem} />
      </div>

      <div className="problem-detail-right">
        <div className="compiler-header">
          <LanguageSelector language={language} onChange={handleLanguageChange} />
          <button onClick={handleRun} disabled={running} className="run-button">
            {running ? "Running..." : "Run ▶"}
          </button>
          <button onClick={handleSubmit} className="submit-button">
            Submit
          </button>
        </div>

        <div className="editor-section">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>

        <div className="input-section">
          <label>Input (stdin)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
          />
        </div>

        <div className="output-section">
          <label>Output</label>
          <OutputPanel result={result} loading={running} />
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;