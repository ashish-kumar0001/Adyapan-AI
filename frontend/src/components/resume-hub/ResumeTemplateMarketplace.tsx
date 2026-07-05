"use client";

import { useState } from "react";
import { Sparkles, Star, ChevronRight, Eye, Play } from "lucide-react";
import { motion } from "framer-motion";

interface Template {
  id: string;
  name: string;
  category: "company" | "profession" | "career";
  atsScore: number;
  tags: string[];
}

interface ResumeTemplateMarketplaceProps {
  onSelectTemplate: (templateName: string) => void;
}

export function ResumeTemplateMarketplace({ onSelectTemplate }: ResumeTemplateMarketplaceProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "company" | "profession" | "career">("all");

  const companyTemplates: Template[] = [
    { id: "google-swe", name: "Google Software Engineer", category: "company", atsScore: 98, tags: ["Innovation", "Scalability"] },
    { id: "amazon-sde", name: "Amazon SDE", category: "company", atsScore: 97, tags: ["Leadership", "Ownership"] },
    { id: "msft-eng", name: "Microsoft Engineer", category: "company", atsScore: 96, tags: ["Excellence", "Systems"] },
    { id: "meta-eng", name: "Meta Engineer", category: "company", atsScore: 98, tags: ["Scale", "Performance"] },
    { id: "apple-eng", name: "Apple Engineer", category: "company", atsScore: 95, tags: ["Design", "Hardware"] },
    { id: "startup-res", name: "Startup Resume", category: "company", atsScore: 94, tags: ["Impact", "Speed"] },
  ];

  const professionTemplates: Template[] = [
    { id: "fullstack", name: "Full Stack Developer", category: "profession", atsScore: 96, tags: ["MERN", "TypeScript"] },
    { id: "frontend", name: "Frontend Developer", category: "profession", atsScore: 95, tags: ["React", "Next.js"] },
    { id: "backend", name: "Backend Developer", category: "profession", atsScore: 96, tags: ["Node.js", "Docker"] },
    { id: "ml-eng", name: "Machine Learning Engineer", category: "profession", atsScore: 98, tags: ["Python", "PyTorch"] },
    { id: "data-scientist", name: "Data Scientist", category: "profession", atsScore: 97, tags: ["Pandas", "SQL"] },
    { id: "devops", name: "DevOps Engineer", category: "profession", atsScore: 98, tags: ["CI/CD", "Kubernetes"] },
  ];

  const careerTemplates: Template[] = [
    { id: "internship", name: "Internship Resume", category: "career", atsScore: 92, tags: ["Student", "Projects"] },
    { id: "fresher", name: "Fresher Resume", category: "career", atsScore: 93, tags: ["No Experience", "Academics"] },
    { id: "campus", name: "Campus Placement Resume", category: "career", atsScore: 94, tags: ["Structured", "Aptitude"] },
    { id: "experienced", name: "Experienced Professional", category: "career", atsScore: 97, tags: ["Corporate", "Leadership"] },
  ];

  const allTemplates = [...companyTemplates, ...professionTemplates, ...careerTemplates];

  const filteredTemplates = allTemplates.filter((t) => {
    if (activeCategory === "all") return true;
    return t.category === activeCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent border border-amber-500/10 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider">
            <Sparkles size={12} /> AI Templates
          </div>
          <h2 className="text-3xl font-extrabold text-white">Select a World-Class Resume Template</h2>
          <p className="text-sm text-gray-300">
            Choose from blueprints optimized for specific companies, professions, or career levels. Optimized to pass ATS checks and catch recruiter attention.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-4 rounded-2xl shrink-0">
          <div className="text-3xl font-black text-amber-500">98%</div>
          <div className="text-xs text-gray-400 font-medium leading-normal">Average ATS Pass Rate</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl max-w-md">
        {(["all", "company", "profession", "career"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all capitalize ${
              activeCategory === cat ? "bg-amber-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            {cat === "all" ? "All Templates" : `${cat}s`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTemplates.map((template, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={template.id}
            className="flex flex-col bg-white/3 border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-amber-500/5 transition-all"
          >
            {/* Visual preview layout simulating Canva */}
            <div className="relative aspect-[3/4] bg-[#0c0c12] border-b border-white/5 p-4 flex flex-col justify-between group-hover:bg-[#08080d] transition-colors">
              <div className="space-y-3 opacity-40 group-hover:opacity-60 transition-opacity">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="w-12 h-1.5 bg-white/40 rounded" />
                  <div className="w-6 h-1.5 bg-white/20 rounded" />
                </div>
                {/* Lines */}
                <div className="space-y-1.5">
                  <div className="w-full h-1 bg-white/10 rounded" />
                  <div className="w-5/6 h-1 bg-white/10 rounded" />
                  <div className="w-4/6 h-1 bg-white/10 rounded" />
                </div>
                <div className="h-px bg-white/10 w-full" />
                {/* Section */}
                <div className="space-y-1.5">
                  <div className="w-10 h-1.5 bg-white/30 rounded" />
                  <div className="w-full h-1 bg-white/10 rounded" />
                  <div className="w-5/6 h-1 bg-white/10 rounded" />
                </div>
              </div>

              {/* Action Overlays */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2">
                <button
                  onClick={() => onSelectTemplate(template.name)}
                  className="w-full max-w-[120px] py-2 bg-amber-500 text-black font-bold text-[10px] rounded-lg shadow-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
                >
                  <Play size={12} fill="currentColor" /> Use Template
                </button>
                <button className="w-full max-w-[120px] py-1.5 bg-white/10 text-white font-bold text-[10px] rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-1 border border-white/10">
                  <Eye size={12} /> Preview
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] text-amber-500/80 font-bold">
                <span className="flex items-center gap-0.5"><Star size={10} fill="currentColor"/> Premium</span>
                <span>ATS {template.atsScore}%</span>
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-3 space-y-1.5">
              <h3 className="font-bold text-xs text-white group-hover:text-amber-500 truncate transition-colors" title={template.name}>{template.name}</h3>
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-gray-400 text-[9px] font-medium rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
