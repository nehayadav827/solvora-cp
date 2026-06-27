import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProblemBySlug } from "../api/problemApi";
import { runCode } from "../api/compilerApi";
import { submitCode } from "../api/submissionApi";
import { useAuthStore } from "../store/authStore";
import ProblemStatement from "../components/problems/ProblemStatement";
import CodeEditor from "../components/compiler/CodeEditor";
import LanguageSelector from "../components/compiler/LanguageSelector";
import OutputPanel from "../components/compiler/OutputPanel";
import VerdictCard from "../components/compiler/VerdictCard";
import SubmissionHistory from "../components/submissions/SubmissionHistory";
import { DEFAULT_CODE } from "../constants/languages";
import AiPanel from "../components/ai/AiPanel";

const TABS = ["Description", "Submissions"];

const ProblemDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Description");

  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [input, setInput] = useState("");

// NEW STATE
const [ioTab, setIoTab] = useState("input");

  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);

  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getProblemBySlug(slug);
        setProblem(res.data.problem);
        if (res.data.problem.examples?.length > 0) {
          setInput(res.data.problem.examples[0].input);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Problem not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setRunResult(null);
    setSubmitResult(null);
  };

  const handleRun = async () => {
  setRunning(true);
  setRunResult(null);
  setSubmitResult(null);

  // Automatically switch to the Output tab
  setIoTab("output");

  try {
    const res = await runCode({
      language,
      code,
      input,
    });

    setRunResult(res.data);
  } catch (err) {
    setRunResult({
      success: false,
      verdict: "Error",
      error: err.response?.data?.message || "Something went wrong",
    });
  } finally {
    setRunning(false);
  }
};

  const handleSubmit = async () => {
    // Redirect to login if not logged in
    if (!user) {
      navigate("/login", { state: { from: `/problems/${slug}` } });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);
    setRunResult(null);

    try {
      const res = await submitCode({ problemSlug: slug, language, code });
      setSubmitResult(res.data.submission);
      // Switch to submissions tab to show history
      setActiveTab("Submissions");
    } catch (err) {
      setSubmitResult({
        verdict: "Error",
        errorMessage: err.response?.data?.message || "Submission failed",
        testCasesPassed: 0,
        totalTestCases: 0,
        runtime: 0,
        language,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="placeholder" style={{ padding: 32 }}>Loading problem...</p>;

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <p className="error">{error}</p>
        <Link to="/problems">← Back to Problems</Link>
      </div>
    );
  }

  return (
    <div className="problem-detail-page">
      {/* ── LEFT PANEL ── */}
      <div className="problem-detail-left">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Description" && (
          <ProblemStatement problem={problem} />
        )}

        {activeTab === "Submissions" && (
          user ? (
            <SubmissionHistory problemSlug={slug} />
          ) : (
            <div style={{ padding: 24 }}>
              <p>Please <Link to="/login">login</Link> to view your submissions.</p>
            </div>
          )
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="problem-detail-right">
        <div className="compiler-header">
          <LanguageSelector language={language} onChange={handleLanguageChange} />
          <button onClick={handleRun} disabled={running} className="run-button">
            {running ? "Running..." : "Run ▶"}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="submit-button">
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        <div className="editor-section">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>

        {/* Show verdict card after submit */}
        {submitResult && (
          <VerdictCard submission={submitResult} />
        )}

        {/* Show run output if no submit result */}
        {!submitResult && (
  <div className="io-section">
    <div className="io-tabs">
      <button className={`io-tab ${ioTab === "input" ? "active" : ""}`}
        onClick={() => setIoTab("input")}>Input</button>
      <button className={`io-tab ${ioTab === "output" ? "active" : ""}`}
        onClick={() => setIoTab("output")}>Output</button>
    </div>
    <div className="io-content">
      {ioTab === "input" ? (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input here..."
        />
      ) : (
        <OutputPanel result={runResult} loading={running} />
      )}
    </div>
  </div>
)}

        {/* Login prompt below editor if not logged in */}
        {!user && (
          <div className="login-prompt">
            <Link to="/login" state={{ from: `/problems/${slug}` }}>
              Login to submit your solution
            </Link>
          </div>
        )}


{/* ── AI Panel — only shown when logged in ── */}
{user && (
  <AiPanel
    code={code}
    language={language}
    problem={problem}
    submitResult={submitResult}
    input={input}
  />
)}

{!user && (
  <div className="ai-login-prompt">
    <span>🤖</span>
    <Link to="/login">Login to use AI features</Link>
  </div>
)}




      </div>
    </div>
  );
};

export default ProblemDetail;