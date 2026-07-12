import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, CheckCircle2, Target, Trophy, Flame, Search, Filter, HelpCircle, Play, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

export function DsaPracticeView() {
  const [view, setView] = useState<"dashboard" | "problem">("dashboard");
  const [activeProblem, setActiveProblem] = useState<Record<string, string> | null>(null);
  const [problems, setProblems] = useState<Record<string, string>[]>([]);
  const [code, setCode] = useState("");
  const [aiReview, setAiReview] = useState<{ timeComplexity: string; spaceComplexity: string; optimizationTips: string[] } | null>(null);
  const [hint, setHint] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/dsa/problems")
      .then((res) => setProblems(res.data.problems ?? res.data))
      .catch(() => toast.error("Failed to load problems."));
  }, []);

  const stats = [
    { label: "Problems Solved", value: "42", icon: CheckCircle2, color: "text-green-500" },
    { label: "Accuracy", value: "85%", icon: Target, color: "text-blue-500" },
    { label: "Current Streak", value: "7 Days", icon: Flame, color: "text-orange-500" },
    { label: "Global Rank", value: "#1,234", icon: Trophy, color: "text-yellow-500" }
  ];

  const categories = ["Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "Graphs", "DP", "Greedy"];
  
  const handleOpenProblem = (p: Record<string, string>) => {
    setActiveProblem(p);
    setCode("// Write your solution here\\n\\nfunction solve() {\\n\\n}");
    setAiReview(null);
    setHint(null);
    setView("problem");
  };

  const requestHint = async () => {
    setLoading(true);
    setHint(null);
    try {
      const res = await api.post("/dsa/hint", { problemId: activeProblem?.id, code });
      setHint(res.data);
    } catch {
      toast.error("Failed to fetch AI hint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setLoading(true);
    setAiReview(null);
    try {
      const res = await api.post("/dsa/review", { problemId: activeProblem?.id, code });
      setAiReview(res.data);
    } catch {
      toast.error("Failed to submit code for AI review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (view === "problem" && activeProblem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-full gap-4 text-white overflow-hidden"
      >
        {/* Left: Problem Statement */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-1/2 flex flex-col bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
            <motion.button
              onClick={() => setView("dashboard")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back
            </motion.button>
            <h2 className="font-bold">{activeProblem.title}</h2>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              activeProblem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
              activeProblem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>{activeProblem.difficulty}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="prose prose-invert max-w-none text-sm text-gray-300"
            >
              <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
              <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
              
              <h4 className="text-white mt-6 mb-2 font-semibold">Example 1:</h4>
              <pre className="bg-black/50 p-3 rounded-lg border border-white/5">
                Input: nums = [2,7,11,15], target = 9<br/>
                Output: [0,1]<br/>
                Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
              </pre>

              <h4 className="text-white mt-6 mb-2 font-semibold">Constraints:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>2 &lt;= nums.length &lt;= 10^4</code></li>
                <li><code>-10^9 &lt;= nums[i] &lt;= 10^9</code></li>
              </ul>
            </motion.div>

            {/* AI Hint Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <motion.button
                onClick={requestHint}
                disabled={loading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-bold"
              >
                <HelpCircle size={16} /> Need an AI Hint?
              </motion.button>

              <AnimatePresence>
                {hint && (
                  <motion.div
                    key="hints"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-4"
                  >
                    {[hint.hint1, hint.hint2].map((h, i) => (
                      <motion.div
                        key={i}
                        custom={i}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg"
                      >
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Hint {i + 1}</span>
                        <p className="text-sm text-gray-300 mt-1">{h}</p>
                      </motion.div>
                    ))}
                    <motion.div
                      custom={2}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg"
                    >
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Optimal Approach</span>
                      <p className="text-sm text-gray-300 mt-1">{hint.approach}</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right: Code Editor & Results */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="w-1/2 flex flex-col gap-4"
        >
          <div className="flex-1 bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-400">JavaScript</span>
              <motion.button
                onClick={submitCode}
                disabled={loading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition-colors"
              >
                <Play size={14} fill="currentColor" /> {loading ? "Running..." : "Submit to AI"}
              </motion.button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-[#0d0d12] text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          {/* AI Review Result */}
          <AnimatePresence>
            {aiReview && (
              <motion.div
                key="ai-review"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
                className="h-64 bg-[#0a0a0f] rounded-xl border border-white/10 overflow-y-auto p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  >
                    <Sparkles className="text-amber-500" size={18} />
                  </motion.div>
                  <h3 className="font-bold text-amber-500">AI Solution Review</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Time Complexity</span>
                    <span className="text-sm text-green-400 font-mono">{aiReview.timeComplexity}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Space Complexity</span>
                    <span className="text-sm text-yellow-400 font-mono">{aiReview.spaceComplexity}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Optimization Tips</span>
                  <ul className="space-y-2">
                    {aiReview.optimizationTips.map((tip: string, j: number) => (
                      <motion.li
                        key={j}
                        custom={j}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-amber-500 mt-0.5">•</span> {tip}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  }

  // Dashboard View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full text-white gap-6 overflow-y-auto pr-2 custom-scrollbar"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
                className={`p-3 rounded-lg bg-white/5 ${s.color}`}
              >
                <Icon size={24} />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 font-medium">{s.label}</p>
                <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex gap-6 flex-1">
        
        {/* Left: Problem List */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <Code2 size={18} className="text-amber-500" />
              </motion.div>
              Recommended Problems
            </h3>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Search problems..." className="bg-transparent border-none text-sm text-white focus:outline-none w-48" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {problems.map((p, i) => (
              <motion.div
                key={p.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => handleOpenProblem(p)}
                className="flex items-center justify-between p-4 bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    p.difficulty === 'Easy' ? 'bg-green-500' :
                    p.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium group-hover:text-amber-400 transition-colors">{p.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-white/5 text-gray-300 text-xs rounded-md">{p.category}</span>
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-md">{p.company}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Categories */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-72 flex flex-col gap-4"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <Filter size={16} className="text-amber-500" />
              </motion.div>
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c, j) => (
                <motion.button
                  key={j}
                  custom={j}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-3 py-1.5 bg-black/40 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-amber-400 text-xs rounded-lg transition-colors"
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="font-bold text-amber-500 mb-2">Weekly Contest</h3>
              <p className="text-sm text-gray-300 mb-4">Compete with peers and improve your rating!</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="w-full py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Register Now
              </motion.button>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            >
              <Trophy size={80} className="absolute -bottom-4 -right-4 text-amber-500/10" />
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
}

