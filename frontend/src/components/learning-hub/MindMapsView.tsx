"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge, Download, Share2, Loader2, RefreshCw, CheckCircle2,
  Plus, History, HelpCircle, ChevronRight, Search, FileText, Cpu, Copy, FileDown
} from "lucide-react";
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
  const [topic, setTopic] = useState("Cellular Respiration");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "help">("dashboard");
  const [activeNode, setActiveNode] = useState("1");

  const { socket, isConnected } = useSocket();
  const userIdRef = useRef<string>("");

  const MOCK_MAP = {
    nodes: [
      { id: "1", type: "root", data: { label: "Cellular Respiration" }, position: { x: 250, y: 50 } },
      { id: "2", type: "child", data: { label: "Glycolysis" }, position: { x: 100, y: 150 } },
      { id: "3", type: "child", data: { label: "Krebs Cycle" }, position: { x: 250, y: 150 } },
      { id: "4", type: "child", data: { label: "Electron Transport Chain" }, position: { x: 400, y: 150 } },
      { id: "5", type: "grandchild", data: { label: "Occurs in Cytoplasm" }, position: { x: 50, y: 250 } },
      { id: "6", type: "grandchild", data: { label: "Produces 2 ATP" }, position: { x: 150, y: 250 } },
      { id: "7", type: "grandchild", data: { label: "Mitochondrial Matrix" }, position: { x: 250, y: 250 } },
      { id: "8", type: "grandchild", data: { label: "Inner Membrane" }, position: { x: 380, y: 250 } },
      { id: "9", type: "grandchild", data: { label: "Produces 34 ATP" }, position: { x: 460, y: 250 } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e1-3", source: "1", target: "3" },
      { id: "e1-4", source: "1", target: "4" },
      { id: "e2-5", source: "2", target: "5" },
      { id: "e2-6", source: "2", target: "6" },
      { id: "e3-7", source: "3", target: "7" },
      { id: "e4-8", source: "4", target: "8" },
      { id: "e4-9", source: "4", target: "9" }
    ]
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) userIdRef.current = (JSON.parse(raw) as { id?: string })?.id ?? "";
    } catch { /* */ }
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Starting Mind Map Generator...");

    const stages = [
      { msg: "Mapping central concept...", prg: 25 },
      { msg: "Expanding branch attributes...", prg: 50 },
      { msg: "Connecting leaves relationships...", prg: 75 },
      { msg: "Complete!", prg: 100 }
    ];

    let step = 0;
    const timer = setInterval(() => {
      if (step < stages.length) {
        setStatusMsg(stages[step].msg);
        setProgress(stages[step].prg);
        step++;
      } else {
        clearInterval(timer);
        setGenerating(false);
        setMapData(MOCK_MAP);
        setActiveNode("1");
      }
    }, 1000);
  };

  const loadHistoryItem = (topicName: string) => {
    setTopic(topicName);
    setMapData(MOCK_MAP);
    setActiveNode("1");
  };

  const rootNode = mapData?.nodes.find(n => n.id === "1") || mapData?.nodes[0];
  const childNodes = mapData?.nodes.filter(n => n.type === "child") || [];
  const getEdgesForNode = (nodeId: string) => mapData?.edges.filter(e => e.source === nodeId) || [];

  return (
    <div className="flex flex-col gap-4 p-4 antialiased text-white max-w-6xl mx-auto w-full text-xs">
      {/* SECTION 1 — HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            <GitMerge className="text-amber-500" size={20} /> Mind Maps
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Generate AI-powered visual knowledge graphs to brainstorm core concepts.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setMapData(null); setGenerating(false); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Create New
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("recent-maps-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <History size={16} /> History
          </button>
          <button
            onClick={() => setActiveView(activeView === "help" ? "dashboard" : "help")}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <HelpCircle size={16} /> Help
          </button>
        </div>
      </div>

      {activeView === "help" ? (
        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl space-y-2.5">
          <h2 className="text-sm font-bold text-white">Mind Maps Help</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            State the topic you would like to map. The visual graphs partition core theoretical blocks, link relative nodes together, and write brief context statements.
          </p>
          <button onClick={() => setActiveView("dashboard")} className="h-8 px-3 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all">
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {generating ? (
            <div className="flex flex-col items-center justify-center p-6 border border-white/5 bg-white/[0.01] rounded-xl space-y-4 max-w-xl mx-auto w-full text-center">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Generating Map Nodes via AI Pipeline</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{statusMsg}</p>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5 justify-center">
                <Loader2 className="animate-spin" size={12} /> {progress}% Complete
              </div>
            </div>
          ) : !mapData ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* SECTION 3 — CONFIGURATION WORKSPACE */}
              <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl max-w-2xl mx-auto w-full space-y-4">
                <h3 className="text-xs font-bold text-white">Configure Mind Map</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Topic to Visualize</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Cellular Respiration, React Lifecycle"
                      className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1"
                  >
                    <GitMerge size={16} /> Generate Mind Map
                  </button>
                  <button
                    onClick={() => setTopic("")}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* SECTION 4 — PRESETS SECTION */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-white">Choose Preset Concepts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Cellular Respiration map", desc: "Visualizes glycolysis, Krebs cycle, and electron transport chain nodes connections." },
                    { title: "React Components Lifecycle", desc: "Outlines mounting stages, updating loops, and unmounting methods in functional structures." },
                    { title: "Data Structures Hierarchy", desc: "Builds a visual hierarchy map comparing linear vs non-linear structures." }
                  ].map(tpl => (
                    <div
                      key={tpl.title}
                      onClick={() => setTopic(tpl.title)}
                      className="p-4 border border-white/5 rounded-xl bg-white/[0.01] hover:bg-amber-500/[0.01] hover:border-amber-500/30 transition-all cursor-pointer space-y-1"
                    >
                      <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{tpl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
              {/* LEFT SIDEBAR (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <div className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Map Outlines
                  </span>
                  <div className="space-y-0.5">
                    {mapData.nodes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setActiveNode(n.id)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          activeNode === n.id
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="truncate text-[12px]">{n.data.label}</span>
                        <ChevronRight size={12} className={activeNode === n.id ? "text-amber-500" : "text-gray-600"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT VISUAL CANVAS (6 Cols) */}
              <div className="md:col-span-6 space-y-4">
                <div className="aspect-video relative bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10 flex flex-col items-center">
                    {rootNode && (
                      <>
                        <div className="px-4 py-2 bg-amber-500 text-black font-extrabold rounded-lg shadow-lg shadow-amber-500/20 z-20 text-[12px]">
                          {rootNode.data.label}
                        </div>
                        <div className="w-0.5 h-6 bg-white/20" />
                        <div className="flex gap-2.5 relative justify-center flex-wrap">
                          {childNodes.slice(0, 3).map(node => {
                            const childEdges = getEdgesForNode(node.id);
                            const grandChildren = mapData.nodes.filter(n => childEdges.some(e => e.target === n.id));
                            return (
                              <div key={node.id} className="flex flex-col items-center border border-white/10 bg-white/5 p-2 rounded-lg min-w-[100px]">
                                <div className="text-[11px] font-bold text-white text-center">{node.data.label}</div>
                                {grandChildren.length > 0 && (
                                  <div className="mt-1 space-y-0.5 w-full text-center">
                                    {grandChildren.slice(0, 2).map(gc => (
                                      <div key={gc.id} className="px-1.5 py-0.5 bg-black/40 border border-white/5 rounded text-[10px] text-gray-400">
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

                {/* Footer Controls */}
                <div className="p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-wrap gap-1.5 justify-between items-center">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => alert("📋 Copied map details.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Copy size={14} /> Copy Details
                    </button>
                    <button
                      onClick={() => alert("📥 Exported Mind Map image successfully.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FileDown size={14} /> Export PNG
                    </button>
                  </div>
                  <button
                    onClick={() => setMapData(null)}
                    className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
                  >
                    Start New Map
                  </button>
                </div>
              </div>

              {/* RIGHT SIDEBAR STATS (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <div className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Map Details
                  </span>
                  <div className="space-y-1 text-xs">
                    {[
                      { label: "Target Topic", val: topic },
                      { label: "Total Nodes", val: mapData.nodes.length },
                      { label: "Child Branches", val: childNodes.length },
                      { label: "Format Model", val: "Relational Node Map" }
                    ].map(stat => (
                      <div key={stat.label} className="flex justify-between items-center py-0.5 border-b border-white/[0.03]">
                        <span className="text-gray-400 text-[11px]">{stat.label}</span>
                        <span className="font-extrabold text-white text-[12px]">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11 — RECENT MAPS TABLE */}
          <div id="recent-maps-section" className="space-y-2.5 pt-4 border-t border-white/5">
            <h2 className="text-sm font-bold text-white">Recent Mind Maps</h2>
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Topic</th>
                    <th className="p-2.5">Date Completed</th>
                    <th className="p-2.5 text-center">Nodes count</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: "Cellular Respiration map", date: "Today", count: 9 },
                    { name: "React Components Lifecycle", date: "Yesterday", count: 12 },
                    { name: "Binary Search Tree Visual", date: "6 Jul", count: 15 }
                  ].map(map => (
                    <tr key={map.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-2.5 font-semibold text-white flex items-center gap-1.5 truncate max-w-[180px]">
                        <FileText size={14} className="text-amber-500 shrink-0" /> {map.name}
                      </td>
                      <td className="p-2.5 text-gray-400">{map.date}</td>
                      <td className="p-2.5 text-center text-gray-300 font-medium">{map.count} nodes</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => loadHistoryItem(map.name)}
                          className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-black font-extrabold text-[11px] transition-all"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}