import { useState } from "react";
import { Trophy, Clock, Star, Zap, Code, ShieldCheck, ChevronRight, Play } from "lucide-react";

export function CodingChallengesView() {
  const [view, setView] = useState<"dashboard" | "solve">("dashboard");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const activeChallenge = {
    title: "Daily: Subarray Sum Equals K",
    difficulty: "Medium",
    points: 200,
    timeRemaining: "14:23:05",
    description: "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.\\n\\nA subarray is a contiguous non-empty sequence of elements within an array."
  };

  const leaderboard = [
    { rank: 1, name: "Alex Chen", score: 14500, badges: ["🏆", "🔥"] },
    { rank: 2, name: "Sarah JS", score: 13200, badges: ["🔥"] },
    { rank: 3, name: "You (User)", score: 12100, badges: ["🚀"] },
    { rank: 4, name: "CodeNinja99", score: 11800, badges: [] },
    { rank: 5, name: "BytesMaker", score: 10400, badges: ["⭐"] },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    // Simulate submission outcome
    const passed = Math.random() > 0.3;
    setResult({
      status: passed ? "Accepted" : "Failed",
      score: passed ? activeChallenge.points : 0,
      testCases: passed ? "12/12 Passed" : "4/12 Passed",
      message: passed ? "Excellent logic!" : "Time Limit Exceeded on Test Case 5"
    });
    setSubmitting(false);
  };

  if (view === "solve") {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden rounded-xl border border-white/10">
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={() => setView("dashboard")} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">← Back</button>
            <h2 className="font-bold flex items-center gap-2"><Zap className="text-amber-500" size={18}/> {activeChallenge.title}</h2>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-amber-500 flex items-center gap-1"><Trophy size={14}/> {activeChallenge.points} XP</span>
            <span className="text-red-400 flex items-center gap-1"><Clock size={14}/> {activeChallenge.timeRemaining}</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Problem Statement */}
          <div className="w-1/3 p-6 border-r border-white/10 overflow-y-auto bg-black/20">
            <h3 className="font-bold mb-4">Problem Statement</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{activeChallenge.description}</p>
            
            {result && (
              <div className={`mt-8 p-4 rounded-xl border ${result.status === 'Accepted' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} animate-in fade-in`}>
                <h4 className={`font-bold flex items-center gap-2 ${result.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                  {result.status === 'Accepted' ? <ShieldCheck size={18}/> : <Zap size={18}/>} 
                  {result.status}
                </h4>
                <p className="text-sm mt-2 text-gray-300">Test Cases: <span className="font-mono text-white">{result.testCases}</span></p>
                <p className="text-sm mt-1 text-gray-300">{result.message}</p>
                {result.score > 0 && <p className="text-sm font-bold text-amber-500 mt-2">+{result.score} XP Earned!</p>}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your optimized solution here..."
              className="flex-1 w-full bg-[#0d0d12] text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
              spellCheck={false}
            />
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-3">
              <button className="px-6 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
                Run Tests
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !code}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {submitting ? "Evaluating..." : <><Play size={16} fill="currentColor"/> Submit Final</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 text-white overflow-hidden">
      
      {/* Left: Challenges */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="text-amber-500" /> Coding Challenges</h2>
        
        {/* Daily Challenge Card */}
        <div className="relative bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 overflow-hidden group">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full uppercase tracking-wider">Today&apos;s Daily</span>
                <span className="text-sm font-bold text-red-400 flex items-center gap-1"><Clock size={14}/> {activeChallenge.timeRemaining}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{activeChallenge.title}</h3>
              <p className="text-sm text-gray-300 max-w-md line-clamp-2">{activeChallenge.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-500">{activeChallenge.points} XP</div>
              <span className="text-xs font-medium text-gray-400">Reward</span>
            </div>
          </div>
          
          <button 
            onClick={() => setView("solve")}
            className="relative z-10 mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-amber-500 hover:text-black border border-white/20 hover:border-amber-500 transition-all font-bold text-sm rounded-lg"
          >
            <Code size={16} /> Solve Challenge <ChevronRight size={16} />
          </button>
          
          <Zap size={140} className="absolute -bottom-10 -right-10 text-amber-500/5 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Weekly Challenge */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider mb-3 inline-block">Weekly Contest</span>
            <h3 className="text-lg font-bold">Build a Rate Limiter</h3>
            <p className="text-sm text-gray-400 mt-1">System Design & Implementation</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-amber-500 flex items-center justify-end gap-1"><Trophy size={18}/> 1000 XP</div>
            <span className="text-xs font-medium text-gray-400">Ends in 2 days</span>
          </div>
        </div>
      </div>

      {/* Right: Leaderboard */}
      <div className="w-80 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-black/40">
          <h3 className="font-bold flex items-center gap-2"><Star className="text-amber-500" size={18}/> Global Leaderboard</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {leaderboard.map((user) => (
            <div key={user.rank} className={`flex items-center gap-4 p-3 rounded-lg mb-1 ${user.name.includes("User") ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-white/5"}`}>
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
                  {user.badges.map((b, i) => <span key={i} className="text-xs">{b}</span>)}
                </div>
                <div className="text-xs text-amber-500 font-bold">{user.score.toLocaleString()} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
