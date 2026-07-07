import { useState, useEffect, useRef } from "react";
import { Presentation, Download, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface Slide {
  title: string;
  bullets: string[];
  notes: string;
}

export function PptGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("5 Slides");
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
    socket.on("generate:complete", ({ slides: s }: { slides: Slide[] }) => {
      setSlides(s);
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
  }, [socket]);

  const handleGenerate = () => {
    if (!socket) return;
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Starting generation...");
    socket.emit("generate:start", {
      moduleName: "ppt",
      payload: { topic, slideCount: slideCount.split(" ")[0], userId: userIdRef.current }
    });
  };

  return (
    <div className="flex flex-col h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">PPT Generator</h2>
        <p className="text-sm text-gray-400">
          {isConnected ? <span className="text-green-400 font-bold">● Realtime Connected</span> : <span className="text-red-400">● Reconnecting...</span>}
          {' · '} Generate AI-powered presentations
        </p>
      </div>

      {generating ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-8 bg-white/5 border border-white/10 rounded-xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
            <RefreshCw className="animate-spin" size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Generating Slides via AI Pipeline</h3>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {progress}% Complete
          </div>
        </div>
      ) : !slides ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto w-full space-y-6 mt-10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Presentation Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Pitch Deck for an EdTech Startup" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Slide Count</label>
              <select value={slideCount} onChange={e => setSlideCount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>5 Slides</option>
                <option>10 Slides</option>
                <option>15 Slides</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating || !isConnected || !topic} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
            {generating ? <Loader2 className="animate-spin" size={18} /> : <Presentation size={18} />}
            {generating ? "Crafting Slides..." : "Generate Presentation"}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
              <CheckCircle2 size={18} /> {slides.length} Slides Generated Successfully
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSlides(null)} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">Start Over</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                <Download size={16} /> Download .pptx
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/20 rounded-xl overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6 content-start">
            {slides.map((s, i) => (
              <div key={i} className="aspect-video bg-gradient-to-br from-[#1a1c29] to-[#0f111a] border border-white/10 rounded-xl p-8 flex flex-col justify-center shadow-lg hover:border-amber-500/30 transition-colors">
                <div className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-4">Slide {i + 1}</div>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{s.title}</h3>
                <ul className="space-y-1">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="text-gray-400 text-sm leading-relaxed list-disc ml-4">{b}</li>
                  ))}
                </ul>
                {s.notes && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-wider mb-1">Speaker Notes</p>
                    <p className="text-gray-500 text-xs italic">{s.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}