import { useState, useEffect, useRef } from "react";
import { CheckSquare, ArrowRight, PlayCircle, Trophy, Loader2, RefreshCw } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function QuizGeneratorView() {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5 Questions");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const { socket, isConnected } = useSocket();
  const userIdRef = useRef<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) userIdRef.current = (JSON.parse(raw) as { id?: string })?.id ?? "";
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("generate:progress", ({ progress: p, statusMessage }: { progress: number; statusMessage: string }) => {
      setProgress(p);
      setStatusMsg(statusMessage);
    });
    socket.on("generate:complete", ({ questions: qs }: { questions: Question[] }) => {
      setQuestions(qs);
      setGenerating(false);
      setStep(2);
    });
    socket.on("generate:error", ({ error }: { error: string }) => {
      setGenerating(false);
      alert(`Generation error: ${error}`);
    });
    return () => {
      socket.off("generate:progress");
      socket.off("generate:complete");
      socket.off("generate:error");
    };
  }, [socket]);

  const handleGenerate = () => {
    if (!socket) return;
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Connecting to AI...");
    socket.emit("generate:start", {
      moduleName: "quiz",
      payload: { topic, count: count.split(" ")[0], difficulty, userId: userIdRef.current }
    });
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === questions[currentQ]?.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const getOptionStyle = (opt: string) => {
    if (!selectedAnswer) return "bg-black/20 border border-white/10 text-gray-300 hover:border-amber-500/50 hover:bg-amber-500/10";
    if (opt === questions[currentQ]?.correctAnswer) return "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300";
    if (opt === selectedAnswer) return "bg-red-500/20 border border-red-500/50 text-red-300";
    return "bg-black/20 border border-white/10 text-gray-500 opacity-50";
  };

  return (
    <div className="flex flex-col h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Quiz Generator</h2>
        <p className="text-sm text-gray-400">
          Generate targeted MCQs with AI
        </p>
      </div>

      {step === 1 && generating && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-8 bg-white/5 border border-white/10 rounded-xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
            <RefreshCw className="animate-spin" size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Generating Quiz via AI Pipeline</h3>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {progress}% Complete
          </div>
        </div>
      )}

      {step === 1 && !generating && !showResult && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto w-full space-y-6 mt-10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. React Hooks, AWS Architecture" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Number of Questions</label>
              <select value={count} onChange={e => setCount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>5 Questions</option>
                <option>10 Questions</option>
                <option>20 Questions</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating || !isConnected || !topic} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
            {generating ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
            {generating ? "Generating Quiz..." : "Start Quiz"}
          </button>
        </div>
      )}

      {step === 2 && questions.length > 0 && !showResult && (
        <div className="flex-1 flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-8 max-w-3xl mx-auto w-full">
          <div className="flex justify-between w-full mb-6 text-sm font-semibold text-gray-400">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span className="text-amber-500 flex items-center gap-1"><Trophy size={14} /> Score: {score}</span>
          </div>
          <h3 className="text-xl text-white font-medium mb-8 text-center leading-relaxed">
            {questions[currentQ]?.question}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {questions[currentQ]?.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)}
                className={`p-4 rounded-xl transition-all text-left font-medium ${getOptionStyle(opt)}`}>
                {opt}
              </button>
            ))}
          </div>
          {selectedAnswer && (
            <div className="mt-6 w-full">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
                <p className="text-xs text-gray-400 mb-1 font-semibold">Explanation:</p>
                <p className="text-sm text-gray-200">{questions[currentQ]?.explanation}</p>
              </div>
              <button onClick={handleNext} className="w-full py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                {currentQ < questions.length - 1 ? <>Next Question <ArrowRight size={16} /></> : "View Results"}
              </button>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl p-8 max-w-2xl mx-auto w-full">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6">
            <CheckSquare size={32} />
          </div>
          <h3 className="text-2xl text-white font-bold mb-2">Quiz Completed!</h3>
          <p className="text-gray-400 mb-8">You scored {score}/{questions.length} ({Math.round((score / questions.length) * 100)}% Accuracy)</p>
          <div className="w-full bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
            <div className="text-sm font-semibold text-gray-400 mb-2">
              Strong Topics: <span className="text-green-400">{topic}</span>
            </div>
            <div className="text-sm font-semibold text-gray-400">
              Accuracy: <span className={score / questions.length >= 0.7 ? "text-green-400" : "text-amber-400"}>{Math.round((score / questions.length) * 100)}%</span>
            </div>
          </div>
          <button onClick={() => { setStep(1); setShowResult(false); setQuestions([]); setCurrentQ(0); setScore(0); setSelectedAnswer(null); }}
            className="px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2">
            Try Again <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}