import { useState, useEffect, useRef } from "react";
import { BookOpen, Download, CheckCircle2, Cpu, Loader2 } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

export function NotesGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [topic, setTopic] = useState("Operating Systems");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [noteType, setNoteType] = useState("Detailed Notes");
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

    socket.on("generate:progress", ({ progress, statusMessage }: { progress: number; statusMessage: string }) => {
      setProgress(progress);
      setStatusMsg(statusMessage);
    });

    socket.on("generate:complete", ({ content }: { content: string }) => {
      setNotes(content);
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
      moduleName: "notes",
      payload: { topic, difficulty, type: noteType, userId: userIdRef.current }
    });
  };

  return (
    <div className="flex flex-col h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Notes Generator</h2>
        <p className="text-sm text-gray-400">
          Generate comprehensive study notes with AI
        </p>
      </div>

      {generating ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-8 bg-white/5 border border-white/10 rounded-xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
            <Cpu size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Generating Notes via Pipeline</h3>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {progress}% Complete
          </div>
        </div>
      ) : !notes ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto w-full space-y-6 mt-10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Topic or Subject</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Operating Systems, Advanced Data Structures" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Note Type</label>
              <select value={noteType} onChange={e => setNoteType(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                <option>Detailed Notes</option>
                <option>Short Revision</option>
                <option>Formulas Only</option>
                <option>Exam Cheat Sheet</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating || !isConnected} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
            <BookOpen size={18} />
            Generate Notes
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
              <CheckCircle2 size={18} /> Notes Generated Successfully
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNotes(null)} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">Create New</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-6 overflow-y-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
            {notes}
          </div>
        </div>
      )}
    </div>
  );
}
