import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Star, Zap, Code, ShieldCheck, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  points: number;
  timeRemaining: string;
  description: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  badges: string[];
}

interface SubmissionResult {
  status: string;
  score: number;
  testCases: string;
  message: string;
}

export function CodingChallengesView() {
  const [view, setView] = useState<"dashboard" | "solve">("dashboard");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [chalRes, lbRes] = await Promise.all([
          api.get("/coding-challenges/daily"),
          api.get("/coding-challenges/leaderboard"),
        ]);
        if (!cancelled) {
          setActiveChallenge(chalRes.data);
          setLeaderboard(lbRes.data);
        }
      } catch {
        if (!cancelled) toast.error("Cannot connect to server. Please check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post("/coding-challenges/submit", { code, challengeId: activeChallenge?.id });
      setResult(data);
    } catch {
      toast.error("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "solve") {
    if (!activeChallenge && !loading) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No challenge available. <button onClick={() => setView("dashboard")} className="text-amber-500 underline">Go back</button></p>
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden rounded-xl border border-white/10"
      >
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setView("dashboard")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back
            </motion.button>
            <h2 className="font-bold flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <Zap className="text-amber-500" size={18} />
              </motion.div>
              {activeChallenge?.title ?? "Challenge"}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-amber-500 flex items-center gap-1">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
              >
                <Trophy size={14} />
              </motion.div>
              {activeChallenge?.points ?? 0} XP
            </span>
            <span className="text-red-400 flex items-center gap-1"><Clock size={14}/> {activeChallenge?.timeRemaining ?? "--:--:--"}</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Problem Statement */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-1/3 p-6 border-r border-white/10 overflow-y-auto bg-black/20"
          >
            <h3 className="font-bold mb-4">Problem Statement</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{activeChallenge?.description ?? "No challenge loaded."}</p>
            
            <AnimatePresence>
              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
                  className={`mt-8 p-4 rounded-xl border ${result.status === 'Accepted' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                >
                  <h4 className={`font-bold flex items-center gap-2 ${result.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                    {result.status === 'Accepted' ? <ShieldCheck size={18}/> : <Zap size={18}/>} 
                    {result.status}
                  </h4>
                  <p className="text-sm mt-2 text-gray-300">Test Cases: <span className="font-mono text-white">{result.testCases}</span></p>
                  <p className="text-sm mt-1 text-gray-300">{result.message}</p>
                  {result.score > 0 && <p className="text-sm font-bold text-amber-500 mt-2">+{result.score} XP Earned!</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Editor */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex-1 flex flex-col"
          >
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your optimized solution here..."
              className="flex-1 w-full bg-[#0d0d12] text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
              spellCheck={false}
            />
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Run Tests
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                disabled={submitting || !code}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {submitting ? "Evaluating..." : <><Play size={16} fill="currentColor"/> Submit Final</>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-full gap-6 text-white overflow-hidden"
    >
      
      {/* Left: Challenges */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-2xl font-bold flex items-center gap-2"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <Trophy className="text-amber-500" />
          </motion.div>
          Coding Challenges
        </motion.h2>
        
        {/* Daily Challenge Card */}
        {loading && !activeChallenge ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse space-y-4">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-6 w-64 bg-white/10 rounded" />
            <div className="h-4 w-80 bg-white/10 rounded" />
          </div>
        ) : (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 overflow-hidden group"
          >
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full uppercase tracking-wider">Today&apos;s Daily</span>
                  <span className="text-sm font-bold text-red-400 flex items-center gap-1"><Clock size={14}/> {activeChallenge?.timeRemaining ?? "--:--:--"}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{activeChallenge?.title ?? "No Daily Challenge"}</h3>
                <p className="text-sm text-gray-300 max-w-md line-clamp-2">{activeChallenge?.description ?? ""}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-amber-500">{activeChallenge?.points ?? 0} XP</div>
                <span className="text-xs font-medium text-gray-400">Reward</span>
              </div>
            </div>
            
            {activeChallenge && (
              <motion.button
                onClick={() => setView("solve")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="relative z-10 mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-amber-500 hover:text-black border border-white/20 hover:border-amber-500 transition-all font-bold text-sm rounded-lg"
              >
                <Code size={16} /> Solve Challenge <ChevronRight size={16} />
              </motion.button>
            )}
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            >
              <Zap size={140} className="absolute -bottom-10 -right-10 text-amber-500/5 group-hover:scale-110 transition-transform duration-500" />
            </motion.div>
          </motion.div>
        )}

        {/* Weekly Challenge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider mb-3 inline-block">Weekly Contest</span>
            <h3 className="text-lg font-bold">Build a Rate Limiter</h3>
            <p className="text-sm text-gray-400 mt-1">System Design & Implementation</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-amber-500 flex items-center justify-end gap-1"><Trophy size={18}/> 1000 XP</div>
            <span className="text-xs font-medium text-gray-400">Ends in 2 days</span>
          </div>
        </motion.div>

        {/* Past Challenges */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="font-bold mb-4">Past Challenges</h3>
          <p className="text-sm text-gray-400">No past challenges yet.</p>
        </motion.div>
      </div>

      {/* Right: Leaderboard */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
        className="w-80 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/10 bg-black/40">
          <h3 className="font-bold flex items-center gap-2">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
            >
              <Star className="text-amber-500" size={18} />
            </motion.div>
            Global Leaderboard
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && leaderboard.length === 0 ? (
            <div className="space-y-3 p-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No leaderboard data available.</p>
          ) : (
            leaderboard.map((user, i) => (
              <motion.div
                key={user.rank}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 4 }}
                className={`flex items-center gap-4 p-3 rounded-lg mb-1 ${user.name.includes("User") ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-white/5"}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded-full ${
                  user.rank === 1 ? "bg-yellow-500 text-black" :
                  user.rank === 2 ? "bg-gray-300 text-black" :
                  user.rank === 3 ? "bg-amber-700 text-white" : "text-gray-400"
                }`}>
                  {user.rank}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {user.name}
                    {user.badges.map((b, j) => <span key={j} className="text-xs">{b}</span>)}
                  </div>
                  <div className="text-xs text-amber-500 font-bold">{user.score.toLocaleString()} XP</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
