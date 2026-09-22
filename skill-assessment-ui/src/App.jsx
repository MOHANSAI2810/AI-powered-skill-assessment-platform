import { useState } from "react";

const API_URL = "http://localhost:5195/api";

const subjects = [
  { id: "csharp", name: "C#" },
  { id: "dotnet", name: ".NET" },
  { id: "react", name: "React" },
  { id: "angular", name: "Angular" },
  { id: "javascript", name: "JavaScript" },
  { id: "reasoning", name: "Reasoning" },
  { id: "aptitude", name: "Aptitude" },
  { id: "english", name: "English" },
  { id: "cs-fundamentals", name: "CS Fundamentals" },
];

function App() {
  // =========================================================
  // USER
  // =========================================================

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // =========================================================
  // PAGE
  // =========================================================

  const [page, setPage] = useState("login");

  // =========================================================
  // QUIZ
  // =========================================================

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [score, setScore] = useState(0);

  // =========================================================
  // RESULTS
  // =========================================================

  const [results, setResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  // =========================================================
  // AI SUMMARY
  // =========================================================

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  const [loading, setLoading] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // AI SUMMARY LOADER
  // Does NOT clear the current summary while loading.
  // Does NOT clear the summary on error.
  // =========================================================

  const loadAiSummary = async (userEmail) => {
    if (!userEmail) {
      setAiSummary("");
      return;
    }

    try {
      setAiLoading(true);

      const res = await fetch(
        `${API_URL}/ai/summary?email=${encodeURIComponent(userEmail)}`
      );

      if (!res.ok) {
        throw new Error("Failed to load AI summary");
      }

      const data = await res.json();
      setAiSummary(data.summary || "");
    } catch (err) {
      console.error("AI summary error:", err);
      // Do NOT clear aiSummary on error — keep the previous one visible
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================================
  // GET USER HISTORY (no AI call inside)
  // =========================================================

  const loadResults = async (userEmail) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/assessments?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load previous assessments.");
      }

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("History error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    const userEmail = email.trim();

    await loadResults(userEmail);
    loadAiSummary(userEmail);
    setPage("dashboard");
  };

  // =========================================================
  // START ASSESSMENT
  // =========================================================

  const startAssessment = async (subject) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/questions/${subject}`);

      if (!response.ok) {
        throw new Error("Failed to load questions.");
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No questions found for this subject.");
      }

      const selectedQuestions = data.slice(0, 20);

      setSelectedSubject(subject);
      setQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
      setScore(0);
      setLastResult(null);
      setPage("quiz");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to start assessment.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CHECK ANSWER
  // =========================================================

  const handleOptionClick = async (optionId) => {
    if (selectedOption !== null || checkingAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      setCheckingAnswer(true);
      setError("");

      const response = await fetch(`${API_URL}/questions/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedSubject,
          questionId: Number(currentQuestion.id),
          selectedOptionId: Number(optionId),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to check answer.");
      }

      const data = await response.json();
      const correct = data.isCorrect === true;

      setSelectedOption(Number(optionId));
      setIsAnswerCorrect(correct);

      if (correct) {
        setScore((previousScore) => previousScore + 1);
      }
    } catch (err) {
      console.error("Answer checking error:", err);
      setError("Unable to check the answer. Please try again.");
    } finally {
      setCheckingAnswer(false);
    }
  };

  // =========================================================
  // NEXT QUESTION
  // =========================================================

  const handleNextQuestion = async () => {
    if (selectedOption === null) return;

    if (currentQuestionIndex === questions.length - 1) {
      await finishAssessment();
      return;
    }

    setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
    setError("");
  };

  // =========================================================
  // FINISH ASSESSMENT
  // =========================================================

  const finishAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      const finalScore = score;
      const totalQuestions = questions.length;

      const percentage =
        totalQuestions > 0
          ? Math.round((finalScore / totalQuestions) * 100)
          : 0;

      let remarks = "";
      if (percentage >= 90) remarks = "Excellent";
      else if (percentage >= 80) remarks = "Very Good";
      else if (percentage >= 70) remarks = "Good";
      else if (percentage >= 60) remarks = "Average";
      else remarks = "Needs Improvement";

      const subjectName =
        subjects.find((subject) => subject.id === selectedSubject)?.name ||
        selectedSubject;

      const resultData = {
        emailId: email.trim(),
        name: name.trim(),
        course: subjectName,
        marks: finalScore,
        totalQuestions: totalQuestions,
        percentage: percentage,
        remarks: remarks,
      };

      const response = await fetch(`${API_URL}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Assessment completed but result could not be saved."
        );
      }

      const savedResult = await response.json();

      setLastResult({
        ...resultData,
        ...savedResult,
      });

      // Refresh history AND regenerate AI summary (now includes new quiz)
      await loadResults(email);
      loadAiSummary(email);

      setPage("result");
    } catch (err) {
      console.error("Save result error:", err);

      const totalQuestions = questions.length;
      const finalScore = score;

      const percentage =
        totalQuestions > 0
          ? Math.round((finalScore / totalQuestions) * 100)
          : 0;

      let remarks = "";
      if (percentage >= 90) remarks = "Excellent";
      else if (percentage >= 80) remarks = "Very Good";
      else if (percentage >= 70) remarks = "Good";
      else if (percentage >= 60) remarks = "Average";
      else remarks = "Needs Improvement";

      const subjectName =
        subjects.find((subject) => subject.id === selectedSubject)?.name ||
        selectedSubject;

      setLastResult({
        emailId: email,
        name: name,
        course: subjectName,
        marks: finalScore,
        totalQuestions: totalQuestions,
        percentage: percentage,
        remarks: remarks,
      });

      setError(
        "Assessment completed, but the result could not be saved to the database."
      );

      setPage("result");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  const openDashboard = async () => {
    await loadResults(email);
    loadAiSummary(email);
    setPage("dashboard");
  };

  // =========================================================
  // SUBJECTS
  // =========================================================

  const openSubjects = () => {
    setError("");
    setPage("subjects");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    setEmail("");
    setName("");
    setResults([]);
    setSelectedSubject(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
    setScore(0);
    setLastResult(null);
    setAiSummary("");
    setError("");
    setPage("login");
  };

  // =========================================================
  // SUBJECT NAME
  // =========================================================

  const getSubjectName = (subjectId) =>
    subjects.find((subject) => subject.id === subjectId)?.name || subjectId;

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (page === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-gray-800">AI Powered</h1>
            <h2 className="text-2xl font-semibold text-indigo-600">
              Skill Assessment
            </h2>
            <p className="text-gray-500 mt-3">
              Test your skills across multiple subjects
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  if (page === "dashboard") {
    const averagePercentage =
      results.length > 0
        ? Math.round(
            results.reduce(
              (sum, result) => sum + Number(result.percentage || 0),
              0
            ) / results.length
          )
        : 0;

    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-indigo-600">
                Skill Assessment
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {email}
              </span>
              <button
                onClick={logout}
                className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome, {name}! 👋
            </h1>
            <p className="text-gray-500 mt-2">
              Track your assessment performance and start a new test.
            </p>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-gray-500 text-sm">Assessments Completed</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {results.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-gray-500 text-sm">Average Percentage</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {averagePercentage}%
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-gray-500 text-sm">Available Subjects</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {subjects.length}
              </p>
            </div>
          </div>

          {/* AI INSIGHT */}

          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <h2 className="text-xl font-bold">AI Performance Insights</h2>
              </div>

              {results.length > 0 && (
                <button
                  onClick={() => loadAiSummary(email)}
                  disabled={aiLoading}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                >
                  {aiLoading ? "Generating..." : "Refresh"}
                </button>
              )}
            </div>

            {aiSummary ? (
              <>
                <p className="text-indigo-50 leading-relaxed text-base">
                  {aiSummary}
                </p>
                {aiLoading && (
                  <p className="text-xs text-indigo-200 mt-3">
                    Refreshing summary...
                  </p>
                )}
              </>
            ) : aiLoading ? (
              <div className="flex items-center gap-3 text-indigo-100">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing your performance...</span>
              </div>
            ) : results.length > 0 ? (
              <p className="text-indigo-200 italic">
                Generating your personalized insight...
              </p>
            ) : (
              <p className="text-indigo-200 italic">
                Complete at least one assessment to get your personalized AI
                insights.
              </p>
            )}
          </div>

          {/* START */}

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-2xl font-bold">
              Ready for your next assessment?
            </h2>
            <p className="mt-2 text-indigo-100">
              Choose from 9 different technical and aptitude subjects.
            </p>
            <button
              onClick={openSubjects}
              className="mt-6 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Start New Assessment →
            </button>
          </div>

          {/* HISTORY */}

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              Previous Assessments
            </h2>

            {loading ? (
              <p className="text-gray-500">Loading history...</p>
            ) : results.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-500">
                  No assessments completed yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-3 text-sm text-gray-500">
                        Course
                      </th>
                      <th className="py-3 px-3 text-sm text-gray-500">
                        Marks
                      </th>
                      <th className="py-3 px-3 text-sm text-gray-500">
                        Percentage
                      </th>
                      <th className="py-3 px-3 text-sm text-gray-500">
                        Remarks
                      </th>
                      <th className="py-3 px-3 text-sm text-gray-500">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result, index) => (
                      <tr
                        key={result.id || index}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-4 px-3 font-medium text-gray-800">
                          {result.course}
                        </td>
                        <td className="py-4 px-3">
                          {result.marks} / {result.totalQuestions || 20}
                        </td>
                        <td className="py-4 px-3 font-semibold text-indigo-600">
                          {result.percentage}%
                        </td>
                        <td className="py-4 px-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              Number(result.percentage) >= 75
                                ? "bg-green-100 text-green-700"
                                : Number(result.percentage) >= 40
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {result.remarks}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-sm text-gray-500">
                          {result.createdAt
                            ? new Date(result.createdAt).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // SUBJECTS
  // =========================================================

  if (page === "subjects") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Choose a Subject
              </h1>
              <p className="text-gray-500 mt-2">
                Select a subject to start your 20-question assessment.
              </p>
            </div>

            <button
              onClick={openDashboard}
              className="bg-white px-5 py-2.5 rounded-xl shadow-sm text-gray-700 hover:bg-gray-50"
            >
              ← Dashboard
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subject, index) => (
              <button
                key={subject.id}
                onClick={() => startAssessment(subject.id)}
                disabled={loading}
                className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-500 text-2xl">
                    →
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mt-5">
                  {subject.name}
                </h2>
                <p className="text-sm text-gray-500 mt-2">20 questions</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // QUIZ LOADING
  // =========================================================

  if (loading && page === "quiz") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-5"></div>
          <p className="text-gray-600 font-medium">Saving assessment...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // QUIZ
  // =========================================================

  if (page === "quiz") {
    if (!questions.length) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const progress =
      ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Assessment</p>
                <h1 className="text-xl font-bold text-gray-800">
                  {getSubjectName(selectedSubject)}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Question</p>
                <p className="font-bold text-indigo-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <p className="text-sm font-semibold text-indigo-600 mb-4">
              Question {currentQuestionIndex + 1}
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
              {currentQuestion.text}
            </h2>

            <div className="mt-8 space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected =
                  Number(selectedOption) === Number(option.id);

                let optionClass =
                  "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50";

                if (selectedOption !== null) {
                  if (isSelected && isAnswerCorrect === true) {
                    optionClass =
                      "border-green-500 bg-green-50 text-green-800";
                  } else if (isSelected && isAnswerCorrect === false) {
                    optionClass = "border-red-500 bg-red-50 text-red-800";
                  } else {
                    optionClass = "border-gray-200 bg-gray-50 opacity-60";
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(Number(option.id))}
                    disabled={selectedOption !== null || checkingAnswer}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-all ${optionClass}`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                          isSelected && isAnswerCorrect
                            ? "bg-green-200 text-green-700"
                            : isSelected && isAnswerCorrect === false
                            ? "bg-red-200 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {checkingAnswer && (
              <div className="mt-6 bg-indigo-50 text-indigo-700 rounded-xl p-4 font-semibold">
                Checking answer...
              </div>
            )}

            {!checkingAnswer && selectedOption !== null && (
              <div
                className={`mt-6 rounded-xl p-4 font-semibold ${
                  isAnswerCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isAnswerCorrect ? "✓ Correct Answer!" : "✗ Incorrect Answer"}
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {selectedOption !== null && !checkingAnswer && (
              <button
                onClick={handleNextQuestion}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition"
              >
                {currentQuestionIndex === questions.length - 1
                  ? "Finish Assessment"
                  : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RESULT
  // =========================================================

  if (page === "result") {
    const result = lastResult;
    if (!result) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-5">🎉</div>

          <h1 className="text-3xl font-bold text-gray-800">
            Assessment Completed!
          </h1>
          <p className="text-gray-500 mt-2">{result.course}</p>

          <div className="my-8">
            <p className="text-sm text-gray-500">Your Score</p>
            <p className="text-5xl font-bold text-indigo-600 mt-2">
              {result.marks} / {result.totalQuestions || 20}
            </p>
            <p className="text-2xl font-semibold text-green-600 mt-3">
              {result.percentage}%
            </p>
          </div>

          <div
            className={`rounded-xl p-4 mb-6 ${
              result.percentage >= 75
                ? "bg-green-50 text-green-700"
                : result.percentage >= 40
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="font-bold">{result.remarks}</p>
          </div>

          {error && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={openSubjects}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              Take Another Assessment
            </button>
            <button
              onClick={openDashboard}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;