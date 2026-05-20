"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileText, Sparkles, User, Brain, AlertCircle, Info, RefreshCw, Check } from "lucide-react";
import type { NovelProject } from "@/types/novel";
import { NovelBibleEditor } from "./novel-bible-editor";
import { runAiFeature } from "@/lib/ai/ai-runner";
import type { CharactersDocument } from "@novelwrite/novel-agent";
import { CharactersCardWorkspace } from "./characters/CharactersCardWorkspace";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
] as const;

type Props = {
  project: NovelProject;
  onUpdateProject: (updates: Partial<Omit<NovelProject, "id" | "chapters">>) => void;
  charactersDoc?: CharactersDocument;
  hasCharactersJson?: boolean;
  updateCharacters?: (updater: (doc: CharactersDocument) => void) => void;
  saveMigratedCharacters?: (doc: CharactersDocument) => void;
};

type BibleTab = "project" | "style" | "characters";

export function NovelStoryBibleWorkspace({
  project,
  onUpdateProject,
  charactersDoc,
  hasCharactersJson,
  updateCharacters,
  saveMigratedCharacters,
}: Props) {
  const [activeTab, setActiveTab] = useState<BibleTab>("project");
  const [showMarkdownView, setShowMarkdownView] = useState(false);

  useEffect(() => {
    const handleOpenChar = (e: Event) => {
      const customEvent = e as CustomEvent<{ charName: string }>;
      setActiveTab("characters");
      
      // Let the tab render, then find and scroll to the character title
      setTimeout(() => {
        const charName = customEvent.detail.charName;
        // Search for headers/lines that contain the character's name in a case-insensitive way
        const elements = document.querySelectorAll("h1, h2, h3, h4, h5, p, span, strong, li");
        let targetElement: Element | null = null;
        
        for (let i = 0; i < elements.length; i++) {
          const text = elements[i].textContent?.trim() || "";
          if (text.toLowerCase() === charName.toLowerCase()) {
            targetElement = elements[i];
            break;
          }
        }
        
        // Fallback: search for header content like '## Sarah'
        if (!targetElement) {
          for (let i = 0; i < elements.length; i++) {
            const text = elements[i].textContent?.trim() || "";
            if (
              text.toLowerCase().includes("## " + charName.toLowerCase()) || 
              text.toLowerCase().includes("### " + charName.toLowerCase())
            ) {
              targetElement = elements[i];
              break;
            }
          }
        }

        // Fallback 2: simple substring match
        if (!targetElement) {
          for (let i = 0; i < elements.length; i++) {
            const text = elements[i].textContent?.trim() || "";
            if (text.toLowerCase().includes(charName.toLowerCase())) {
              targetElement = elements[i];
              break;
            }
          }
        }

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          targetElement.classList.add("bg-yellow-100", "transition-all", "duration-500");
          setTimeout(() => {
            targetElement?.classList.remove("bg-yellow-100");
          }, 1500);
        }
      }, 150);
    };

    window.addEventListener("novelwrite:openCharacter", handleOpenChar);
    return () => {
      window.removeEventListener("novelwrite:openCharacter", handleOpenChar);
    };
  }, []);

  // Style capture generator states
  const [stylePrompt, setStylePrompt] = useState("");
  const [generatingStyle, setGeneratingStyle] = useState(false);
  const [styleSuccess, setStyleSuccess] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [showStyleWizard, setShowStyleWizard] = useState(false);

  const handleGenerateStyle = async () => {
    setGeneratingStyle(true);
    setStyleSuccess(false);
    setStyleError(null);


    try {
      let language = "en";
      try {
        const parsed = JSON.parse(project.projectMd || "");
        if (parsed.language) {
          language = parsed.language;
        }
      } catch {}

      const result = await runAiFeature(
        "styleCapture",
        {
          selection: stylePrompt,
          projectMd: project.projectMd || "",
          styleMd: project.styleMd || "",
          charactersMd: project.charactersMd || "",
          continuityMd: project.continuityMd || "",
          activeArtifact: "Artifacts/chapter-001.md",
          activeArtifactContent: "",
          language: language,
        },
        project.ai || { baseUrl: "http://localhost:4000/v1", model: "gpt-4o-mini", apiKey: "" }
      );
      
      if (result && result.displayText) {
        onUpdateProject({ styleMd: result.displayText });
        setStyleSuccess(true);
        setStylePrompt("");
        setTimeout(() => setStyleSuccess(false), 5000);
      } else {
        throw new Error("Empty response received from AI model.");
      }
    } catch (e: any) {
      console.error("AI Style generation failed", e);
      setStyleError(e.message || "Style generation failed. Please confirm your AI Connection settings are active and correct in Project Settings.");
    } finally {
      setGeneratingStyle(false);
    }
  };

  // Parse Project.json settings block
  const rawJson = project.projectMd || "";
  let settingsObj = {
    title: project.title || "My Novel",
    author: "",
    genre: "",
    pov: "Third Person Limited",
    tense: "Past",
    language: "vi",
    targetWordCount: 50000,
    description: ""
  };

  try {
    if (rawJson.trim().startsWith("{")) {
      settingsObj = { ...settingsObj, ...JSON.parse(rawJson) };
    }
  } catch (e) {
    console.error("Error parsing Project.json", e);
  }

  const handleConfigChange = (key: string, value: any) => {
    const updated = {
      ...settingsObj,
      [key]: value
    };
    onUpdateProject({ 
      projectMd: JSON.stringify(updated, null, 2),
      ...(key === "title" ? { title: value } : {})
    });
  };

  const handleContentChange = (field: "styleMd" | "charactersMd" | "continuityMd", value: string) => {
    onUpdateProject({ [field]: value });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Workspace Header & Tabs Selector */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-8 py-3.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-md font-bold text-gray-800">Story Bible Workspace</h2>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-gray-100/80 p-1" aria-label="Story bible files">
          <button
            type="button"
            onClick={() => setActiveTab("project")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "project"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText size={14} /> Project.json
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("style")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "style"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Sparkles size={14} /> Style.md
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("characters")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "characters"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <User size={14} /> Characters.json
          </button>
        </nav>
      </div>

      {/* Main Workspace Editor Panels */}
      <div className="flex flex-1 flex-col overflow-hidden p-8 lg:p-12">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4">
          
          {/* Tab Information Alerts */}
          {activeTab === "project" && (
            <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800">
              <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <strong className="block font-bold mb-0.5">Project Story Configuration (Project.json Settings)</strong>
                Configure the core structural metadata of your novel. The AI Assistant reads these settings to maintain correct Point-of-View, Tense, Genre conventions, and load your custom language packs.
              </div>
            </div>
          )}

          {activeTab === "style" && (
            <div className="flex gap-2.5 rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-primary">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <strong className="block font-bold mb-0.5">Style Control Context (AI-Captured & User-Editable)</strong>
                This file describes your writing voice, rhythm, and preferred technique instructions. 
                You can edit this file manually, or use the <strong>Style Capture</strong> assistant in the right panel to extract style guidelines from your sample text.
              </div>
            </div>
          )}

          {activeTab === "characters" && (
            <div className="flex gap-2.5 rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-primary">
              <User size={16} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <strong className="block font-bold mb-0.5">Character Bible Context (AI-Captured & User-Editable)</strong>
                This file contains names, roles, motivations, relationships, and speech patterns for your characters.
                Update it manually here, or run the <strong>Character Capture</strong> assistant in the right panel to parse characters from selected scenes.
              </div>
            </div>
          )}



          {/* Configuration Panel or Markdown Content Editor */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner">
            {activeTab === "project" && (
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column - General Info */}
                  <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">General Settings</h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Story Title</label>
                      <input
                        type="text"
                        value={settingsObj.title}
                        onChange={(e) => handleConfigChange("title", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                        placeholder="e.g. The Antigravity Chronicles"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Author Name</label>
                      <input
                        type="text"
                        value={settingsObj.author}
                        onChange={(e) => handleConfigChange("author", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                        placeholder="e.g. J. K. Rowling"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Writing Language</label>
                      <select
                        value={settingsObj.language}
                        onChange={(e) => handleConfigChange("language", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none transition-colors bg-white cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name} ({lang.code.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column - Story Parameters */}
                  <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Story Parameters</h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Genre</label>
                      <input
                        type="text"
                        value={settingsObj.genre}
                        onChange={(e) => handleConfigChange("genre", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                        placeholder="e.g. Science Fiction, Fantasy"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Point of View</label>
                        <select
                          value={settingsObj.pov}
                          onChange={(e) => handleConfigChange("pov", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none transition-colors bg-white cursor-pointer"
                        >
                          <option value="Third Person Limited">Third Person Limited</option>
                          <option value="Third Person Omniscient">Third Person Omniscient</option>
                          <option value="First Person">First Person</option>
                          <option value="Second Person">Second Person</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tense</label>
                        <select
                          value={settingsObj.tense}
                          onChange={(e) => handleConfigChange("tense", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none transition-colors bg-white cursor-pointer"
                        >
                          <option value="Past">Past Tense</option>
                          <option value="Present">Present Tense</option>
                          <option value="Future">Future Tense</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Target Word Count</label>
                      <input
                        type="number"
                        value={settingsObj.targetWordCount}
                        onChange={(e) => handleConfigChange("targetWordCount", parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                        min={0}
                        step={1000}
                      />
                    </div>
                  </div>

                  {/* Bottom Row - Premise / Description */}
                  <div className="md:col-span-2 space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Premise & Core Plot</h4>
                    <div>
                      <textarea
                        value={settingsObj.description}
                        onChange={(e) => handleConfigChange("description", e.target.value)}
                        className="w-full h-32 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none transition-colors resize-none"
                        placeholder="Write a high-level summary of your premise, protagonist goals, central conflict, and world rules..."
                      />
                    </div>
                  </div>
                  
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="flex flex-1 flex-col gap-4 overflow-hidden h-full">
                {/* Collapsible/Expandable AI Style Wizard */}
                {!showStyleWizard ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowStyleWizard(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/40 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-purple-50 hover:scale-[1.01] cursor-pointer"
                    >
                      <Sparkles size={13} className="text-primary animate-pulse" />
                      🔮 Generate Style with AI
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/20 p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        <Sparkles size={14} className="animate-pulse" />
                        🔮 AI Style Guidelines Generator
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStyleWizard(false)}
                        className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      Describe your target writing style. You can reference popular novels (e.g. <em>"Harry Potter"</em>), authors (e.g. <em>"Hemingway"</em>), custom style descriptions, or paste a sample text passage to capture style.
                    </p>

                    <div className="flex flex-col md:flex-row gap-2">
                      <textarea
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder="e.g. In the style of Ernest Hemingway. Sentence rhythm should be minimalist, sharp, and high-impact. Avoid excessive adjectives."
                        disabled={generatingStyle}
                        className="flex-1 rounded-lg border border-gray-200 p-2.5 text-xs text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none resize-none h-16"
                      />
                      
                      <button
                        type="button"
                        onClick={handleGenerateStyle}
                        disabled={generatingStyle || !stylePrompt.trim()}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none self-end md:self-stretch flex items-center justify-center gap-1.5 cursor-pointer min-w-[120px]"
                      >
                        {generatingStyle ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            Generate Style
                          </>
                        )}
                      </button>
                    </div>

                    {styleError && (
                      <div className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {styleError}
                      </div>
                    )}

                    {styleSuccess && (
                      <div className="mt-2 text-[11px] text-green-600 flex items-center gap-1">
                        <Check size={12} />
                        Style guide generated and loaded into editor successfully!
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <NovelBibleEditor
                    content={project.styleMd || ""}
                    onChange={(val) => handleContentChange("styleMd", val)}
                    placeholder="Style guidelines..."
                  />
                </div>
              </div>
            )}

            {activeTab === "characters" && (
              <div className="flex-1 flex flex-col min-h-0 relative h-full">
                {charactersDoc && updateCharacters && saveMigratedCharacters ? (
                  !showMarkdownView ? (
                    <div className="flex-1 flex flex-col min-h-0 relative h-full">
                      <div className="absolute top-2.5 right-4 z-10">
                        <button
                          type="button"
                          onClick={() => setShowMarkdownView(true)}
                          className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 transition-all cursor-pointer shadow-sm animate-in fade-in duration-200"
                        >
                          <FileText size={12} />
                          Markdown View (Read-Only)
                        </button>
                      </div>
                      <CharactersCardWorkspace
                        charactersDoc={charactersDoc}
                        hasCharactersJson={!!hasCharactersJson}
                        legacyCharactersMd={project.charactersMd || ""}
                        updateCharacters={updateCharacters}
                        saveMigratedCharacters={saveMigratedCharacters}
                        onViewMarkdown={() => setShowMarkdownView(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0 relative h-full">
                      <div className="absolute top-2.5 right-4 z-10">
                        <button
                          type="button"
                          onClick={() => setShowMarkdownView(false)}
                          className="flex items-center gap-1 bg-primary text-white hover:bg-primary-hover text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          <User size={12} />
                          Switch to Cards View
                        </button>
                      </div>
                      <NovelBibleEditor
                        content={project.charactersMd || ""}
                        onChange={(val) => handleContentChange("charactersMd", val)}
                        placeholder="Character lists..."
                        readOnly={true}
                      />
                    </div>
                  )
                ) : (
                  <NovelBibleEditor
                    content={project.charactersMd || ""}
                    onChange={(val) => handleContentChange("charactersMd", val)}
                    placeholder="Character lists..."
                  />
                )}
              </div>
            )}

          </div>
          
          {/* Status Indicators */}
          <div className="flex justify-between items-center text-[11px] text-gray-400 px-1">
            <span>
              {activeTab === "project" 
                ? "Key-Value Configuration Mode (Project.json)" 
                : "Markdown editor mode (Standard CommonMark Supported)"}
            </span>
            <span>Saved in project memory</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}
