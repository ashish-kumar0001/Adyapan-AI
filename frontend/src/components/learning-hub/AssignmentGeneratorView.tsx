import { useState, useEffect, useRef } from "react";
import { PenTool, Download, Copy, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface AssignmentContent {
  introduction: string;
  body: string;
  conclusion: string;
  references: string[];
}

export function AssignmentGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Undergraduate");
  const [wordCount, setWordCount] = useState("1000 words");
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
    socket.on("generate:complete", ({ assignment }: { assignment: AssignmentContent }) => {
      const text = `# ${topic}\n\n## Introduction\n${assignment.introduction}\n\n## Main Body\n${assignment.body}\n\n## Conclusion\n${assignment.conclusion}\n\n## References\n${assignment.references.map(r => `- ${r}`).join("\n")}`;
      setResult(text);
      setGenerating(false);
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
  }, [socket, topic]);

  const handleGenerate = () => {
    if (!socket) return;
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Starting generation...");
    socket.emit("generate:start", {
      moduleName: "assignment",
      payload: { topic, level, wordCount: wordCount.split(" ")[0], userId: userIdRef.current }
    });
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  return (
    <div className="flex flex-col h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Assignment Generator</h2>
        <p className="text-sm text-gray-400">
          {isConnected ? <span className="text-green-400 font-bold">● Realtime Connected</span> : <span className="text-red-400">● Reconnecting...</span>}
          {' · '} Generate AI-powered academic assignments
        </p>
      </div>

      {generating ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-8 bg-white/5 border border-white/10 rounded-xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
            <RefreshCw className="animate-spin" size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Writing Assignment via AI Pipeline</h3>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {progress}% Complete
          </div>
        </div>
      ) : !result ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto w-full space-y-6 mt-10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Assignment Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. The impact of quantum computing on cryptography" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Academic Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>High School</option>
                <option>Undergraduate</option>
                <option>Master's</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Word Count</label>
              <select value={wordCount} onChange={e => setWordCount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>500 words</option>
                <option>1000 words</option>
                <option>2000 words</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating || !isConnected || !topic} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
            {generating ? <Loader2 className="animate-spin" size={18} /> : <PenTool size={18} />}
            {generating ? "Writing Assignment..." : "Generate Assignment"}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
              <CheckCircle2 size={18} /> Assignment Generated Successfully
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">Start Over</button>
              <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                <Copy size={16} /> Copy Text
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                <Download size={16} /> Export DOCX
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-8 overflow-y-auto font-serif text-base leading-loose text-gray-200 whitespace-pre-wrap shadow-inner max-w-4xl mx-auto w-full">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}