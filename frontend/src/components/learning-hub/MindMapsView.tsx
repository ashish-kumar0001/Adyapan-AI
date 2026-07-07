import { useState, useEffect, useRef } from "react";
import { GitMerge, Download, Share2, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface MindMapNode {
  id: string;
  type: string;
  data: { label: string };
  position: { x: number; y: number };
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export function MindMapsView() {
  const [generating, setGenerating] = useState(false);
  const [mapData, setMapData] = useState<{ nodes: MindMapNode[]; edges: MindMapEdge[] } | null>(null);
  const [topic, setTopic] = useState("");
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
    socket.on("generate:complete", ({ nodes, edges }: { nodes: MindMapNode[]; edges: MindMapEdge[] }) => {
      setMapData({ nodes, edges });
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
      moduleName: "mindmap",
      payload: { topic, userId: userIdRef.current }
    });
  };

  const rootNode = mapData?.nodes.find(n => n.id === "1") || mapData?.nodes[0];
  const childNodes = mapData?.nodes.filter(n => n.id !== rootNode?.id) || [];
  const getEdgesForNode = (nodeId: string) => mapData?.edges.filter(e => e.source === nodeId) || [];

  return (
    <div className="flex flex-col h-full gap-6 relative animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Mind Maps</h2>
        <p className="text-sm text-gray-400">
          Generate AI-powered visual knowledge graphs
        </p>
      </div>

      {generating ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-8 bg-white/5 border border-white/10 rounded-xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
            <RefreshCw className="animate-spin" size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Generating Mind Map via AI Pipeline</h3>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} /> {progress}% Complete
          </div>
        </div>
      ) : !mapData ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto w-full space-y-6 mt-10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Topic to Visualize</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Cellular Respiration, React Lifecycle" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          <button onClick={handleGenerate} disabled={generating || !isConnected || !topic} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
            {generating ? <Loader2 className="animate-spin" size={18} /> : <GitMerge size={18} />}
            {generating ? "Mapping Nodes..." : "Generate Mind Map"}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl z-10">
            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
              <CheckCircle2 size={18} /> {mapData.nodes.length} Nodes Generated
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMapData(null)} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">Start Over</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                <Download size={16} /> Export PNG
              </button>
            </div>
          </div>

          <div className="flex-1 relative bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-8">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 flex flex-col items-center">
              {rootNode && (
                <>
                  <div className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 z-20">
                    {rootNode.data.label}
                  </div>
                  <div className="w-0.5 h-12 bg-white/20" />
                  <div className="flex gap-12 relative" style={{ justifyContent: 'center' }}>
                    <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-white/20" />
                    {childNodes.slice(0, 5).map((node, idx) => {
                      const childEdges = getEdgesForNode(node.id);
                      const grandChildren = mapData.nodes.filter(n => childEdges.some(e => e.target === n.id));
                      return (
                        <div key={node.id} className="flex flex-col items-center pt-6" style={{ position: 'relative' }}>
                          <div className="w-0.5 h-6 bg-white/20 absolute top-0" />
                          <div className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium text-center whitespace-nowrap">
                            {node.data.label}
                          </div>
                          {grandChildren.length > 0 && (
                            <div className="flex gap-4 mt-4">
                              {grandChildren.slice(0, 3).map(gc => (
                                <div key={gc.id} className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs text-center">
                                  {gc.data.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}