import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, FileText, Layout, Send, Loader2, GitCommit, Star, Code2, Globe } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

type Tab = "analyze" | "readme" | "portfolio";

interface GithubAnalysis {
  summary: string;
  estimatedCommits: number;
  estimatedStars: number;
  topLanguages: string[];
  strongestRepos: string[];
  developerType: string;
  specializations: string[];
}

export function GithubPortfolioView() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  
  // States
  const [username, setUsername] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Results
  const [analysis, setAnalysis] = useState<Record<string, any> | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<{ homeHero: { tagline: string; bio: string }; aboutSection: string; projectsToHighlight: Array<{ title: string; tech: string; summary: string }> } | null>(null);

  const handleAnalyze = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await api.post("/github/analyze", { username });
      setAnalysis(res.data.analysis);
    } catch {
      toast.error("Failed to analyze profile. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const handleGenerateReadme = async () => {
    if (!projectName) return;
    setLoading(true);
    try {
      const res = await api.post("/github/readme", { projectName, extraContext: projectContext });
      setReadme(res.data.readmeContent);
    } catch {
      toast.error("Failed to generate README. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const handleBuildPortfolio = async () => {
    if (!analysis) {
      toast.error("Please analyze your GitHub profile first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/github/portfolio", { profileData: JSON.stringify(analysis) });
      setPortfolio(res.data);
    } catch {
      toast.error("Failed to build portfolio. Please check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden rounded-xl border border-white/10"
    >
      
      {/* Header Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex p-4 gap-2 border-b border-white/10 bg-white/5"
      >
        {([
          { id: "analyze" as Tab, label: "Analyze Profile", icon: GitBranch },
          { id: "readme" as Tab, label: "Generate README", icon: FileText },
          { id: "portfolio" as Tab, label: "Build Portfolio", icon: Layout },
        ]).map((t, i) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <motion.button
              key={t.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => setActiveTab(t.id)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-amber-500 text-black" : "text-gray-400 hover:bg-white/10"
              }`}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <Icon size={16} />
              </motion.div>
              {t.label}
            </motion.button>
          );
        })}
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* Analyze Tab */}
          {activeTab === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h3 className="font-bold mb-2">Connect GitHub Account</h3>
                <p className="text-sm text-gray-400 mb-4">Enter your GitHub username to extract your top projects and generate a professional identity summary.</p>
                
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. torvalds"
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <motion.button
                    onClick={handleAnalyze}
                    disabled={loading || !username}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-6 py-2.5 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Extract
                  </motion.button>
                </div>
              </motion.div>

              <AnimatePresence>
                {analysis && (
                  <motion.div
                    key="analysis-results"
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="col-span-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-xl">
                      <h4 className="text-amber-500 font-bold mb-2">Developer Identity Summary</h4>
                      <p className="text-gray-300">{analysis.summary}</p>
                    </motion.div>
                    
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4, scale: 1.01 }} className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 18 }}
                        className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"
                      >
                        <GitCommit size={24} />
                      </motion.div>
                      <div>
                        <div className="text-2xl font-bold">{analysis.estimatedCommits.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Commits</div>
                      </div>
                    </motion.div>

                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4, scale: 1.01 }} className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 18 }}
                        className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg"
                      >
                        <Star size={24} />
                      </motion.div>
                      <div>
                        <div className="text-2xl font-bold">{analysis.estimatedStars}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Stars Earned</div>
                      </div>
                    </motion.div>

                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="col-span-2 bg-white/5 border border-white/10 p-6 rounded-xl">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 280, damping: 18 }}
                        >
                          <Code2 className="text-amber-500" size={18} />
                        </motion.div>
                        Top Languages
                      </h4>
                      <div className="flex gap-2">
                        {analysis.topLanguages.map((l: string, j: number) => (
                          <motion.span
                            key={j}
                            custom={j}
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-full text-sm font-medium"
                          >
                            {l}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Readme Tab */}
          {activeTab === "readme" && (
            <motion.div
              key="readme"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-6 h-full"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="w-1/3 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold">README Generator</h3>
                <p className="text-sm text-gray-400">Generate a stunning, badge-filled README for your open source project.</p>
                
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50"
                />
                
                <textarea
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  placeholder="Briefly describe what it does (optional)..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />

                <motion.button
                  onClick={handleGenerateReadme}
                  disabled={loading || !projectName}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="mt-auto w-full py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>} Generate Markdown
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="flex-1 bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="p-3 bg-white/5 border-b border-white/10 text-xs font-mono text-gray-400 uppercase tracking-wider">
                  README.md
                </div>
                <textarea
                  value={readme || ""}
                  readOnly
                  placeholder="Markdown will appear here..."
                  className="flex-1 w-full bg-transparent text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none"
                />
              </motion.div>
            </motion.div>
          )}

          {/* Portfolio Tab */}
          {activeTab === "portfolio" && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center h-full space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-4"
              >
                <Globe className="text-amber-500" size={40} />
              </motion.div>
              <h2 className="text-3xl font-bold">1-Click Portfolio Builder</h2>
              <p className="text-gray-400 max-w-lg">
                We&apos;ll use your GitHub identity and resume data to instantly generate and host a beautiful, responsive developer portfolio.
              </p>
              
              {!portfolio ? (
                <motion.button
                  onClick={handleBuildPortfolio}
                  disabled={loading}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-8 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 text-lg mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <Layout size={20}/>} Build My Website
                </motion.button>
              ) : (
                <motion.div
                  key="portfolio-result"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
                  className="w-full bg-white/5 border border-white/10 p-6 rounded-xl text-left mt-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-amber-500">Website Draft Generated!</h3>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-bold transition-colors"
                    >
                      Publish Live
                    </motion.button>
                  </div>
                  
                  <div className="space-y-4">
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="bg-black/40 p-4 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">About Section Preview</span>
                      <p className="text-xl font-medium">{portfolio.aboutSection.slice(0, 120)}...</p>
                    </motion.div>
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-black/40 p-4 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">About Section</span>
                      <p className="text-gray-300">{portfolio.aboutSection}</p>
                    </motion.div>
                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-black/40 p-4 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-2">Featured Projects</span>
                      {portfolio.projectsToHighlight.map((p, j) => (
                        <div key={j} className="mb-2 last:mb-0">
                          <strong className="text-amber-500">{p.title}</strong> - <span className="text-sm text-gray-400">{p.tech}</span>
                          <p className="text-sm text-gray-300">{p.summary}</p>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

