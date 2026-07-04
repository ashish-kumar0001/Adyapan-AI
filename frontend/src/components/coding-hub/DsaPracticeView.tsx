import { useState } from "react";
import { Code2, CheckCircle2, Target, Trophy, Flame, Search, Filter, HelpCircle, Play, Sparkles } from "lucide-react";

export function DsaPracticeView() {
  const [view, setView] = useState<"dashboard" | "problem">("dashboard");
  const [activeProblem, setActiveProblem] = useState<Record<string, any> | null>(null);
  const [code, setCode] = useState("");
  const [aiReview, setAiReview] = useState<Record<string, any> | null>(null);
  const [hint, setHint] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const stats = [
    { label: "Problems Solved", value: "42", icon: CheckCircle2, color: "text-green-500" },
    { label: "Accuracy", value: "85%", icon: Target, color: "text-blue-500" },
    { label: "Current Streak", value: "7 Days", icon: Flame, color: "text-orange-500" },
    { label: "Global Rank", value: "#1,234", icon: Trophy, color: "text-yellow-500" }
  ];

  const categories = ["Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "Graphs", "DP", "Greedy"];
  
  const mockProblems = [
    { id: 1, title: "Two Sum", difficulty: "Easy", category: "Arrays", company: "Google" },
    { id: 2, title: "Longest Substring Without Repeating", difficulty: "Medium", category: "Strings", company: "Amazon" },
    { id: 3, title: "Merge K Sorted Lists", difficulty: "Hard", category: "Linked List", company: "Microsoft" },
  ];

  const handleOpenProblem = (p: Record<string, any>) => {
    setActiveProblem(p);
    setCode("// Write your solution here\\n\\nfunction solve() {\\n\\n}");
    setAiReview(null);
    setHint(null);
    setView("problem");
  };

  const requestHint = async () => {
    setLoading(true);
    // Simulate AI delay
    await new Promise(r => setTimeout(r, 1500));
    setHint({
      hint1: "Try using a hash map to store the values you've seen so far.",
      hint2: "For each element x, check if (target - x) exists in the map.",
      approach: "A one-pass hash table approach allows O(N) time complexity by storing array values and their indices."
    });
    setLoading(false);
  };

  const submitCode = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setAiReview({
      status: "Accepted",
      timeComplexity: "O(N) - You iterate through the array exactly once.",
      spaceComplexity: "O(N) - The hash map stores at most N elements.",
      optimizationTips: [
        "Your solution is optimal for time complexity.",
        "Ensure you handle edge cases where the array has less than 2 elements.",
        "Consider using a Map object instead of a plain JS object for better performance."
      ]
    });
    setLoading(false);
  };

  if (view === "problem" && activeProblem) {
    return (
      <div className="flex h-full gap-4 text-white overflow-hidden">
        {/* Left: Problem Statement */}
        <div className="w-1/2 flex flex-col bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
            <button onClick={() => setView("dashboard")} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">← Back</button>
            <h2 className="font-bold">{activeProblem.title}</h2>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              activeProblem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
              activeProblem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>{activeProblem.difficulty}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="prose prose-invert max-w-none text-sm text-gray-300">
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
            </div>

            {/* AI Hint Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <button 
                onClick={requestHint}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-bold"
              >
                <HelpCircle size={16} /> Need an AI Hint?
              </button>

              {hint && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Hint 1</span>
                    <p className="text-sm text-gray-300 mt-1">{hint.hint1}</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Hint 2</span>
                    <p className="text-sm text-gray-300 mt-1">{hint.hint2}</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Optimal Approach</span>
                    <p className="text-sm text-gray-300 mt-1">{hint.approach}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Results */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="flex-1 bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-400">JavaScript</span>
              <button 
                onClick={submitCode}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition-colors"
              >
                <Play size={14} fill="currentColor" /> {loading ? "Running..." : "Submit to AI"}
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-[#0d0d12] text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          {/* AI Review Result */}
          {aiReview && (
            <div className="h-64 bg-[#0a0a0f] rounded-xl border border-white/10 overflow-y-auto p-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-500" size={18} />
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
                  {aiReview.optimizationTips.map((tip: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="flex flex-col h-full text-white gap-6 overflow-y-auto pr-2 custom-scrollbar">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-white/5 ${s.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">{s.label}</p>
                <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex gap-6 flex-1">
        
        {/* Left: Problem List */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Code2 size={18} className="text-amber-500"/> Recommended Problems</h3>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Search problems..." className="bg-transparent border-none text-sm text-white focus:outline-none w-48" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mockProblems.map((p) => (
              <div key={p.id} onClick={() => handleOpenProblem(p)} className="flex items-center justify-between p-4 bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all group">
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
              </div>
            ))}
          </div>
        </div>

        {/* Right: Categories */}
        <div className="w-72 flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold flex items-center gap-2 mb-4"><Filter size={16} className="text-amber-500"/> Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <button key={i} className="px-3 py-1.5 bg-black/40 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-amber-400 text-xs rounded-lg transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-amber-500 mb-2">Weekly Contest</h3>
              <p className="text-sm text-gray-300 mb-4">Compete with peers and improve your rating!</p>
              <button className="w-full py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                Register Now
              </button>
            </div>
            <Trophy size={80} className="absolute -bottom-4 -right-4 text-amber-500/10" />
          </div>
        </div>

      </div>
    </div>
  );
}
