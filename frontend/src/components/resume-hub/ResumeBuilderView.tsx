"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import {
  FileText, ArrowLeft, Save, Sparkles, Download, Plus, Trash2, Edit,
  ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, Maximize2, Building, RefreshCw
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";

interface ResumeBuilderViewProps {
  setView: (v: ResumeHubViewType) => void;
  selectedTemplate: string;
}

export function ResumeBuilderView({ setView, selectedTemplate }: ResumeBuilderViewProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [title, setTitle] = useState("My Professional Resume");
  const [template, setTemplate] = useState(selectedTemplate);
  const [targetCompany, setTargetCompany] = useState("Google");
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  
  // Custom Preview Controls
  const [zoom, setZoom] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form Fields
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const [summary, setSummary] = useState("");
  
  const [education, setEducation] = useState<Array<{ institution: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string; grade: string }>>([
    { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" }
  ]);

  const [experience, setExperience] = useState<Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>>([
    { company: "", role: "", startDate: "", endDate: "", description: "" }
  ]);

  const [projects, setProjects] = useState<Array<{ name: string; techStack: string; description: string }>>([
    { name: "", techStack: "", description: "" }
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [certifications, setCertifications] = useState<Array<{ name: string; issuer: string; date: string }>>([
    { name: "", issuer: "", date: "" }
  ]);

  const [achievements, setAchievements] = useState<string[]>([""]);
  const [languages, setLanguages] = useState<string[]>([""]);

  // AI Summary Generator
  const handleAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post("/resume/generate-summary", {
        personalInfo,
        education,
        experience,
        skills,
      });
      if (res.data.success && res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // AI Experience Bullet Enhancer
  const handleAIExperience = async (index: number) => {
    setGeneratingAI(true);
    try {
      const item = experience[index];
      const res = await api.post("/resume/enhance-experience", {
        role: item.role,
        company: item.company,
        description: item.description,
      });
      if (res.data.success && res.data.description) {
        const updated = [...experience];
        updated[index].description = res.data.description;
        setExperience(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // AI Project Enhancer
  const handleAIProject = async (index: number) => {
    setGeneratingAI(true);
    try {
      const item = projects[index];
      const res = await api.post("/resume/enhance-project", {
        name: item.name,
        techStack: item.techStack,
        description: item.description,
      });
      if (res.data.success && res.data.description) {
        const updated = [...projects];
        updated[index].description = res.data.description;
        setProjects(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Optimize Entire Resume for Selected Target Company
  const handleAIOptimizeCompany = async () => {
    setGeneratingAI(true);
    try {
      const resumeJson = {
        personalInfo,
        summary,
        education,
        experience,
        projects,
        skills,
        certifications,
        achievements,
        languages
      };
      const res = await api.post("/resume/optimize-resume", {
        resumeJson,
        targetCompany,
      });
      if (res.data.success && res.data.resume) {
        const r = res.data.resume;
        if (r.personalInfo) setPersonalInfo(r.personalInfo);
        if (r.summary) setSummary(r.summary);
        if (r.education) setEducation(r.education);
        if (r.experience) setExperience(r.experience);
        if (r.projects) setProjects(r.projects);
        if (r.skills) setSkills(r.skills);
        if (r.certifications) setCertifications(r.certifications);
        if (r.achievements) setAchievements(r.achievements);
        if (r.languages) setLanguages(r.languages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Save Resume Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        template,
        personalInfo,
        education,
        experience,
        projects,
        skills,
        certifications,
        achievements,
        languages,
        targetCompany,
      };

      if (resumeId) {
        await api.put(`/resume/update/${resumeId}`, payload);
      } else {
        const res = await api.post("/resume/create", payload);
        if (res.data.success && res.data.resume) {
          setResumeId(res.data.resume.id);
        }
      }
      alert("✅ Resume draft saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  // Export PDF / DOCX
  const handleExport = async (type: "pdf" | "docx") => {
    if (!resumeId) {
      alert("Please save the resume draft first before exporting.");
      return;
    }
    setExporting(type);
    try {
      const response = await api.post(`/resume/export-${type}`, { resumeId }, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title.replace(/\s+/g, "_")}.${type}`;
      link.click();
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to export ${type.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  // Add/Remove Helpers
  const addEdu = () => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" }]);
  const removeEdu = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, key: string, val: string) => {
    const updated = [...education];
    (updated[i] as any)[key] = val;
    setEducation(updated);
  };

  const addExp = () => setExperience([...experience, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
  const removeExp = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));
  const updateExp = (i: number, key: string, val: string) => {
    const updated = [...experience];
    (updated[i] as any)[key] = val;
    setExperience(updated);
  };

  const addProj = () => setProjects([...projects, { name: "", techStack: "", description: "" }]);
  const removeProj = (i: number) => setProjects(projects.filter((_, idx) => idx !== i));
  const updateProj = (i: number, key: string, val: string) => {
    const updated = [...projects];
    (updated[i] as any)[key] = val;
    setProjects(updated);
  };

  const addCert = () => setCertifications([...certifications, { name: "", issuer: "", date: "" }]);
  const removeCert = (i: number) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCert = (i: number, key: string, val: string) => {
    const updated = [...certifications];
    (updated[i] as any)[key] = val;
    setCertifications(updated);
  };

  const addAchievement = () => setAchievements([...achievements, ""]);
  const removeAchievement = (i: number) => setAchievements(achievements.filter((_, idx) => idx !== i));
  const updateAchievement = (i: number, val: string) => {
    const updated = [...achievements];
    updated[i] = val;
    setAchievements(updated);
  };

  const addLanguage = () => setLanguages([...languages, ""]);
  const removeLanguage = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i));
  const updateLanguage = (i: number, val: string) => {
    const updated = [...languages];
    updated[i] = val;
    setLanguages(updated);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (sk: string) => setSkills(skills.filter(s => s !== sk));

  const templates = ["Modern", "Professional", "Minimal", "ATS Friendly", "Developer", "Student"];
  const companies = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Startup"];

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("resume-hub")}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-500 focus:outline-none text-lg font-bold text-white py-0.5 px-1 rounded transition-colors"
            />
            <p className="text-[10px] text-white/40 px-1">Selected Template: {template}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {exporting === "pdf" ? "Exporting..." : "Download PDF"}
          </button>
          <button
            onClick={() => handleExport("docx")}
            disabled={exporting !== null}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/5 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> {exporting === "docx" ? "Exporting..." : "Download DOCX"}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Form Panel: 40% */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
          {/* Steps Navigator */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <button
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="p-1.5 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Step {activeStep} of 10: {
                activeStep === 1 ? "Personal Info" :
                activeStep === 2 ? "Professional Summary" :
                activeStep === 3 ? "Education" :
                activeStep === 4 ? "Experience" :
                activeStep === 5 ? "Projects" :
                activeStep === 6 ? "Skills" :
                activeStep === 7 ? "Certifications" :
                activeStep === 8 ? "Achievements" :
                activeStep === 9 ? "Languages" : "Optimize & Template"
              }
            </span>
            <button
              onClick={() => setActiveStep(prev => Math.min(10, prev + 1))}
              disabled={activeStep === 10}
              className="p-1.5 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content Block */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5 space-y-4">
            
            {/* 1. Personal Info */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white">Personal Information</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={personalInfo.fullName}
                    onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="Email"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={personalInfo.phone}
                    onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="Phone"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={personalInfo.location}
                    onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                    placeholder="Location (e.g. London, UK)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={personalInfo.linkedin}
                    onChange={e => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="LinkedIn Profile URL"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={personalInfo.github}
                    onChange={e => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                    placeholder="GitHub Profile URL"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={personalInfo.portfolio}
                    onChange={e => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                    placeholder="Personal Portfolio URL"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* 2. Professional Summary */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Professional Summary</h3>
                  <button
                    onClick={handleAISummary}
                    disabled={generatingAI}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Sparkles size={11} /> {generatingAI ? "Summarizing..." : "AI Generate"}
                  </button>
                </div>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Summarize your professional experience, technical expertise, and career aspirations..."
                  className="w-full h-44 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            )}

            {/* 3. Education */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Education</h3>
                  <button onClick={addEdu} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {education.map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                    <button onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={13}/></button>
                    <input type="text" placeholder="Institution" value={item.institution} onChange={e => updateEdu(idx, "institution", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Degree (e.g. Bachelor of Science)" value={item.degree} onChange={e => updateEdu(idx, "degree", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Field of Study" value={item.fieldOfStudy} onChange={e => updateEdu(idx, "fieldOfStudy", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="Start Date" value={item.startDate} onChange={e => updateEdu(idx, "startDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                      <input type="text" placeholder="End Date" value={item.endDate} onChange={e => updateEdu(idx, "endDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                      <input type="text" placeholder="Grade/GPA" value={item.grade} onChange={e => updateEdu(idx, "grade", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Experience */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Work Experience</h3>
                  <button onClick={addExp} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {experience.map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                    <div className="flex justify-between items-center pr-6">
                      <button
                        onClick={() => handleAIExperience(idx)}
                        disabled={generatingAI}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        <Sparkles size={10} /> AI Improve
                      </button>
                      <button onClick={() => removeExp(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={13}/></button>
                    </div>
                    <input type="text" placeholder="Company Name" value={item.company} onChange={e => updateExp(idx, "company", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Job Role / Title" value={item.role} onChange={e => updateExp(idx, "role", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Start Date" value={item.startDate} onChange={e => updateExp(idx, "startDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                      <input type="text" placeholder="End Date" value={item.endDate} onChange={e => updateExp(idx, "endDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    </div>
                    <textarea placeholder="Job Description (responsibilities and technical achievements)..." value={item.description} onChange={e => updateExp(idx, "description", e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white resize-none" />
                  </div>
                ))}
              </div>
            )}

            {/* 5. Projects */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Projects</h3>
                  <button onClick={addProj} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {projects.map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                    <div className="flex justify-between items-center pr-6">
                      <button
                        onClick={() => handleAIProject(idx)}
                        disabled={generatingAI}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        <Sparkles size={10} /> AI Improve
                      </button>
                      <button onClick={() => removeProj(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={13}/></button>
                    </div>
                    <input type="text" placeholder="Project Name" value={item.name} onChange={e => updateProj(idx, "name", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Technologies Used (comma separated)" value={item.techStack} onChange={e => updateProj(idx, "techStack", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <textarea placeholder="Project Details and description..." value={item.description} onChange={e => updateProj(idx, "description", e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white resize-none" />
                  </div>
                ))}
              </div>
            )}

            {/* 6. Technical Skills */}
            {activeStep === 6 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white">Skills</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill()}
                    placeholder="Enter a skill..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                  <button onClick={addSkill} className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                      {s} <button onClick={() => removeSkill(s)} className="text-red-400 hover:text-red-300 font-bold ml-1">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Certifications */}
            {activeStep === 7 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Certifications</h3>
                  <button onClick={addCert} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {certifications.map((item, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                    <button onClick={() => removeCert(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={13}/></button>
                    <input type="text" placeholder="Certification Name" value={item.name} onChange={e => updateCert(idx, "name", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Issuer Name" value={item.issuer} onChange={e => updateCert(idx, "issuer", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                    <input type="text" placeholder="Date Earned (e.g. Jan 2026)" value={item.date} onChange={e => updateCert(idx, "date", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                  </div>
                ))}
              </div>
            )}

            {/* 8. Achievements */}
            {activeStep === 8 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Achievements</h3>
                  <button onClick={addAchievement} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={ach}
                      onChange={e => updateAchievement(idx, e.target.value)}
                      placeholder="e.g. Secured 1st place in National Hackathon 2025"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                    <button onClick={() => removeAchievement(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            )}

            {/* 9. Languages */}
            {activeStep === 9 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">Languages</h3>
                  <button onClick={addLanguage} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12}/> Add</button>
                </div>
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={lang}
                      onChange={e => updateLanguage(idx, e.target.value)}
                      placeholder="e.g. English (Fluent), Hindi (Native)"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                    <button onClick={() => removeLanguage(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            )}

            {/* 10. Optimize & Template Choice */}
            {activeStep === 10 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-white">Target Company AI Optimization</h3>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Select a target company to automatically align your technical summaries, project phrasing, and highlighted skills with their core corporate values.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={targetCompany}
                      onChange={e => setTargetCompany(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    >
                      {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      onClick={handleAIOptimizeCompany}
                      disabled={generatingAI}
                      className="px-4 py-2.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} className={generatingAI ? "animate-spin" : ""} /> Optimize
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-white">Choose Layout Style</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(t => (
                      <div
                        key={t}
                        onClick={() => setTemplate(t)}
                        className={`p-3 rounded-lg border text-center text-[10px] font-bold cursor-pointer transition-all ${template === t ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"}`}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Preview Panel: 60% */}
        <div className={`lg:col-span-7 flex flex-col gap-4 overflow-hidden relative ${isFullscreen ? "fixed inset-0 z-[999] bg-[#060b0e] p-8" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-500" /> Live Render Preview
            </h2>
            
            {/* Preview controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
                <button onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="p-1 text-gray-400 hover:text-white"><ZoomOut size={13}/></button>
                <span className="text-[10px] font-bold text-gray-300 min-w-[32px] text-center">{zoom}%</span>
                <button onClick={() => setZoom(prev => Math.min(150, prev + 10))} className="p-1 text-gray-400 hover:text-white"><ZoomIn size={13}/></button>
              </div>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Interactive White A4 Page Sheet */}
          <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-6 overflow-auto flex justify-center items-start min-h-[500px]">
            <div
              className="bg-white text-black p-10 shadow-2xl transition-all duration-300 w-[595px] min-h-[842px]"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                fontFamily: template === "Minimal" ? "Georgia, serif" : "system-ui, sans-serif"
              }}
            >
              <ResumePreviewTemplate
                personalInfo={personalInfo}
                summary={summary}
                education={education}
                experience={experience}
                projects={projects}
                skills={skills}
                certifications={certifications}
                achievements={achievements}
                languages={languages}
                template={template}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nested Preview Render Template
interface PreviewProps {
  personalInfo: any;
  summary: string;
  education: any[];
  experience: any[];
  projects: any[];
  skills: string[];
  certifications: any[];
  achievements: string[];
  languages: string[];
  template: string;
}

function ResumePreviewTemplate({
  personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages, template
}: PreviewProps) {
  return (
    <div className="text-[10px] text-gray-800 leading-relaxed space-y-4">
      {/* Header */}
      <div className={`text-center space-y-1 ${template === "Minimal" ? "text-left border-b border-gray-300 pb-3" : ""}`}>
        <h4 className={`text-lg font-extrabold text-black tracking-wide ${template === "Developer" ? "text-amber-600" : ""}`}>
          {personalInfo.fullName || "Candidate Name"}
        </h4>
        <div className="text-[9px] text-gray-500 flex flex-wrap justify-center gap-2">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
        <div className="text-[9px] text-gray-500 flex flex-wrap justify-center gap-2">
          {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>• GitHub: {personalInfo.github}</span>}
          {personalInfo.portfolio && <span>• Web: {personalInfo.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Professional Summary</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9px] text-gray-700 text-justify">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.some(e => e.role || e.company) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Work Experience</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {experience.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between font-bold text-black text-[9.5px]">
                <span>{item.role || "Role"} @ {item.company || "Company"}</span>
                <span className="text-[8.5px] text-gray-400">{item.startDate} - {item.endDate}</span>
              </div>
              {item.description && (
                <p className="text-[8.5px] text-gray-600 pl-2 border-l border-gray-200 whitespace-pre-line">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.some(p => p.name || p.techStack) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Projects</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {projects.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-black text-[9.5px]">{item.name || "Project Title"}</div>
              {item.techStack && (
                <div className="text-[8px] text-amber-700 italic">Tech Stack: {item.techStack}</div>
              )}
              {item.description && (
                <p className="text-[8.5px] text-gray-600 pl-2 border-l border-gray-200 whitespace-pre-line">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.some(e => e.institution || e.degree) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Education</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {education.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between font-bold text-black">
                <span>{item.degree || "Degree"} in {item.fieldOfStudy || "Specialization"}</span>
                <span className="text-[8.5px] text-gray-400">{item.startDate} - {item.endDate}</span>
              </div>
              <div className="text-[8.5px] text-gray-600">{item.institution}</div>
              {item.grade && <div className="text-[8px] text-gray-400">Grade / GPA: {item.grade}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Technical Skills</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9.5px] text-gray-700">{skills.join(", ")}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.some(c => c.name || c.issuer) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Certifications</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <ul className="list-disc pl-3 text-[9px] text-gray-700 space-y-0.5">
            {certifications.map((c, idx) => (
              <li key={idx}>
                {c.name} {c.issuer && `by ${c.issuer}`} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      {achievements.some(a => a) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Key Achievements</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <ul className="list-disc pl-3 text-[9px] text-gray-700 space-y-0.5">
            {achievements.filter(Boolean).map((ach, idx) => <li key={idx}>{ach}</li>)}
          </ul>
        </div>
      )}

      {/* Languages */}
      {languages.some(l => l) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Languages</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9.5px] text-gray-700">{languages.filter(Boolean).join(", ")}</p>
        </div>
      )}

    </div>
  );
}
