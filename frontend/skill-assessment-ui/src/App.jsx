import { useState } from "react";

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
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const startAssessment = async (subject) => {
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5195/api/questions/${subject}`
      );

      if (!response.ok) {
        throw new Error("Failed to load questions");
      }

      const data = await response.json();

      setSelectedSubject(subject);
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setScore(0);
      setFinished(false);
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (optionId) => {
    if (selectedOption !== null) {
      return;
    }

    setSelectedOption(optionId);

    const currentQuestion = questions[currentQuestionIndex];

    if (optionId === currentQuestion.correctOptionId) {
      setScore((previousScore) => previousScore + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
    setSelectedOption(null);
  };

  const chooseAnotherSubject = () => {
    setSelectedSubject(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
  };

  // SUBJECT SELECTION
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-10 lg:p-12">

            {/* Header */}
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-600">
                AI POWERED ASSESSMENT
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                AI Powered Skill Assessment
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Test your knowledge and evaluate your skills across multiple
                technical and non-technical subjects.
              </p>
            </div>

            {/* Subject Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Choose a subject
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a subject to start your 20-question assessment.
              </p>
            </div>

            {/* Subjects */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => startAssessment(subject.id)}
                  disabled={loading}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                        {subject.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        50 questions available
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer info */}
            <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">
                Each assessment randomly selects{" "}
                <span className="font-semibold text-slate-700">
                  20 questions
                </span>{" "}
                from the available question bank.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (loading || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-8 py-10 text-center shadow-lg">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>

          <h2 className="text-xl font-bold text-slate-800">
            Loading Assessment
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparing your {selectedSubject} questions...
          </p>
        </div>
      </div>
    );
  }

  // FINAL RESULT
  if (finished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl sm:p-12">

          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
            Assessment Completed!
          </h1>

          <p className="mt-2 text-lg font-semibold text-indigo-600">
            {subjects.find((s) => s.id === selectedSubject)?.name}
          </p>

          <p className="mt-6 text-sm font-medium uppercase tracking-wider text-slate-400">
            Your Score
          </p>

          <div className="mt-2 text-6xl font-extrabold text-indigo-600">
            {score}
            <span className="text-3xl text-slate-400">
              {" "}
              / {questions.length}
            </span>
          </div>

          <div className="mt-4 text-2xl font-bold text-slate-700">
            {percentage}%
          </div>

          {/* Result message */}
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            {percentage >= 80 ? (
              <>
                <p className="font-bold text-green-600">
                  Excellent Performance! 🎉
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  You have demonstrated a strong understanding of this subject.
                </p>
              </>
            ) : percentage >= 60 ? (
              <>
                <p className="font-bold text-blue-600">
                  Good Performance! 👍
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  You have a good foundation, but there is room to improve.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-orange-600">
                  Keep Practicing! 💪
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Practice more questions to strengthen your knowledge.
                </p>
              </>
            )}
          </div>

          {/* Buttons */}
          <button
            onClick={chooseAnotherSubject}
            className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            Choose Another Subject
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const isCorrect =
    selectedOption === currentQuestion.correctOptionId;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              {subjects.find((s) => s.id === selectedSubject)?.name}
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Skill Assessment
            </h2>
          </div>

          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-slate-600">
              {currentQuestionIndex + 1}
            </span>

            <span className="text-sm text-slate-400">
              {" "}
              / {questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / questions.length) * 100
              }%`,
            }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">

          {/* Question Number */}
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-600">
              Question {currentQuestionIndex + 1}
            </span>
          </div>

          {/* Question */}
          <h1 className="text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl">
            {currentQuestion.text}
          </h1>

          {/* Options */}
          <div className="mt-8 space-y-4">
            {currentQuestion.options.map((option) => {
              const isSelected =
                selectedOption === option.id;

              const isCorrectOption =
                option.id === currentQuestion.correctOptionId;

              let optionClasses =
                "group flex w-full items-center rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ";

              if (selectedOption === null) {
                optionClasses +=
                  "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md cursor-pointer";
              } else if (isSelected && isCorrectOption) {
                optionClasses +=
                  "border-green-500 bg-green-50 text-green-800";
              } else if (isSelected && !isCorrectOption) {
                optionClasses +=
                  "border-red-500 bg-red-50 text-red-800";
              } else if (!isSelected && isCorrectOption) {
                optionClasses +=
                  "border-green-500 bg-green-50 text-green-800";
              } else {
                optionClasses +=
                  "border-slate-200 bg-slate-50 text-slate-400";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={selectedOption !== null}
                  className={optionClasses}
                >
                  {/* Option Letter */}
                  <span
                    className={`mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      selectedOption === null
                        ? "bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white"
                        : isSelected && isCorrectOption
                        ? "bg-green-500 text-white"
                        : isSelected && !isCorrectOption
                        ? "bg-red-500 text-white"
                        : isCorrectOption
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + option.id - 1)}
                  </span>

                  {/* Option Text */}
                  <span className="text-base font-medium sm:text-lg">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Result */}
          {selectedOption !== null && (
            <div
              className={`mt-6 rounded-2xl p-5 ${
                isCorrect
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold ${
                    isCorrect
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {isCorrect ? "✓" : "✗"}
                </div>

                <div>
                  <p className="font-bold">
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </p>

                  {!isCorrect && (
                    <p className="mt-1 text-sm">
                      The correct answer is option{" "}
                      {String.fromCharCode(
                        65 + currentQuestion.correctOptionId - 1
                      )}
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          {selectedOption !== null && (
            <button
              onClick={handleNextQuestion}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              {currentQuestionIndex === questions.length - 1
                ? "Finish Assessment"
                : "Next Question →"}
            </button>
          )}

        </div>

        {/* Bottom information */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Select an option to continue. You cannot change your answer after
          selecting it.
        </p>
      </div>
    </div>
  );
}

export default App;