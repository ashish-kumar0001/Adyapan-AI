import { useState } from "react";
import { GitBranch, FileText, Layout, Send, Loader2, GitCommit, Star, Code2, Globe } from "lucide-react";

type Tab = "analyze" | "readme" | "portfolio";

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
  const [portfolio, setPortfolio] = useState<Record<string, any> | null>(null);

  const handleAnalyze = async () => {
    if (!username) return;
    setLoading(true);
    // Simulate API Call
    await new Promise(r => setTimeout(r, 2000));
    setAnalysis({
      summary: "A passionate full-stack developer specializing in scalable Node.js backends and responsive React interfaces.",
      topLanguages: ["TypeScript", "Python", "Rust"],
      estimatedCommits: 1450,
      estimatedStars: 128,
      keyProjects: [
        { name: "Adyapan AI", description: "An AI-powered education platform" },
        { name: "FastAPI-Boilerplate", description: "Production ready Python backend template" }
      ]
    });
    setLoading(false);
  };

  const handleGenerateReadme = async () => {
    if (!projectName) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setReadme(`# ${projectName}\\n\\n![License](https://img.shields.io/badge/license-MIT-blue.svg)\\n\\n${projectContext || 'A blazingly fast modern web application.'}\\n\\n## Installation\\n\\n\`\`\`bash\\nnpm install\\nnpm run dev\\n\`\`\`\\n\\n## Features\\n- Highly scalable\\n- AI Integrated\\n- Fully typed`);
    setLoading(false);
  };

  const handleBuildPortfolio = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 3000));
    setPortfolio({
      homeHero: { tagline: "Building the Future of EdTech", bio: "Full Stack Engineer @ Adyapan" },
      aboutSection: "I started coding when I was 14 and never looked back. I love building tools that empower developers.",
      projectsToHighlight: [
        { title: "Adyapan AI", tech: "Next.js, Prisma", summary: "Built an AI mentor system serving 10k users." }
      ]
    });
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden rounded-xl border border-white/10">
      
      {/* Header Tabs */}
      <div className="flex p-4 gap-2 border-b border-white/10 bg-white/5">
        <button
          onClick={() => setActiveTab("analyze")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analyze" ? "bg-amber-500 text-black" : "text-gray-400 hover:bg-white/10"
          }`}
        >
          <GitBranch size={16} /> Analyze Profile
        </button>
        <button
          onClick={() => setActiveTab("readme")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "readme" ? "bg-amber-500 text-black" : "text-gray-400 hover:bg-white/10"
          }`}
        >
          <FileText size={16} /> Generate README
        </button>
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "portfolio" ? "bg-amber-500 text-black" : "text-gray-400 hover:bg-white/10"
          }`}
        >
          <Layout size={16} /> Build Portfolio
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Analyze Tab */}
        {activeTab === "analyze" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
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
                <button 
                  onClick={handleAnalyze}
                  disabled={loading || !username}
                  className="px-6 py-2.5 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Extract
                </button>
              </div>
            </div>

            {analysis && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="col-span-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-xl">
                  <h4 className="text-amber-500 font-bold mb-2">Developer Identity Summary</h4>
                  <p className="text-gray-300">{analysis.summary}</p>
                </div>
                
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><GitCommit size={24}/></div>
                  <div>
                    <div className="text-2xl font-bold">{analysis.estimatedCommits.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Commits</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg"><Star size={24}/></div>
                  <div>
                    <div className="text-2xl font-bold">{analysis.estimatedStars}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Stars Earned</div>
                  </div>
                </div>

                <div className="col-span-2 bg-white/5 border border-white/10 p-6 rounded-xl">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><Code2 className="text-amber-500" size={18}/> Top Languages</h4>
                  <div className="flex gap-2">
                    {analysis.topLanguages.map((l: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-full text-sm font-medium">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Readme Tab */}
        {activeTab === "readme" && (
          <div className="flex gap-6 h-full">
            <div className="w-1/3 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
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

              <button 
                onClick={handleGenerateReadme}
                disabled={loading || !projectName}
                className="mt-auto w-full py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>} Generate Markdown
              </button>
            </div>

            <div className="flex-1 bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="p-3 bg-white/5 border-b border-white/10 text-xs font-mono text-gray-400 uppercase tracking-wider">
                README.md
              </div>
              <textarea
                value={readme || ""}
                readOnly
                placeholder="Markdown will appear here..."
                className="flex-1 w-full bg-transparent text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center h-full space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="text-amber-500" size={40} />
            </div>
            <h2 className="text-3xl font-bold">1-Click Portfolio Builder</h2>
            <p className="text-gray-400 max-w-lg">
              We&apos;ll use your GitHub identity and resume data to instantly generate and host a beautiful, responsive developer portfolio.
            </p>
            
            {!portfolio ? (
              <button 
                onClick={handleBuildPortfolio}
                disabled={loading}
                className="px-8 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 text-lg mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Layout size={20}/>} Build My Website
              </button>
            ) : (
              <div className="w-full bg-white/5 border border-white/10 p-6 rounded-xl text-left animate-in fade-in slide-in-from-bottom-4 mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-amber-500">Website Draft Generated!</h3>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-bold transition-colors">Publish Live</button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Hero Tagline</span>
                    <p className="text-xl font-medium">{portfolio.homeHero.tagline}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">About Section</span>
                    <p className="text-gray-300">{portfolio.aboutSection}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase font-bold block mb-2">Featured Projects</span>
                    {portfolio.projectsToHighlight.map((p: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <strong className="text-amber-500">{p.title}</strong> - <span className="text-sm text-gray-400">{p.tech}</span>
                        <p className="text-sm text-gray-300">{p.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
