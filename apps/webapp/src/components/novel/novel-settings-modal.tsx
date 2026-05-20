"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertCircle, Play, Save, RefreshCw } from "lucide-react";
import type { NovelProject } from "@/types/novel";
import { completeChat } from "@/lib/ai/ai-client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: NovelProject;
  onSave: (updates: Partial<Omit<NovelProject, "id" | "chapters">>) => void;
  onClearAll?: () => void;
};

type Tab = "general" | "ai";

export function NovelSettingsModal({ isOpen, onClose, project, onSave, onClearAll }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  // General settings state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [pov, setPov] = useState("Third Person Limited");
  const [tense, setTense] = useState("Past");
  const [language, setLanguage] = useState("en");
  const [targetWordCount, setTargetWordCount] = useState(50000);
  const [description, setDescription] = useState("");

  // AI settings state
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiHeaders, setAiHeaders] = useState("");

  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.title || "");
      
      let parsed = {
        title: project.title || "",
        author: "",
        genre: "",
        pov: "Third Person Limited",
        tense: "Past",
        language: "en",
        targetWordCount: 50000,
        description: ""
      };
      
      try {
        const rawJson = project.projectMd || "";
        if (rawJson.trim().startsWith("{")) {
          parsed = { ...parsed, ...JSON.parse(rawJson) };
        }
      } catch (e) {
        console.error("Error parsing projectMd inside modal", e);
      }
      
      setAuthor(parsed.author || "");
      setGenre(parsed.genre || "");
      setPov(parsed.pov || "Third Person Limited");
      setTense(parsed.tense || "Past");
      setLanguage(parsed.language || "en");
      setTargetWordCount(parsed.targetWordCount || 50000);
      setDescription(parsed.description || "");

      setAiBaseUrl(project.ai?.baseUrl || "");
      setAiModel(project.ai?.model || "");
      setAiApiKey(project.ai?.apiKey || "");
      setAiHeaders(project.ai?.headers ? JSON.stringify(project.ai.headers, null, 2) : "");
      setTestResult(null);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      let headers: Record<string, string> | undefined = undefined;
      if (aiHeaders.trim()) {
        try {
          headers = JSON.parse(aiHeaders.trim());
        } catch (e) {
          setTestResult({
            ok: false,
            message: "Invalid JSON format in Custom Headers field.",
          });
          setTesting(false);
          return;
        }
      }

      const config = {
        baseUrl: aiBaseUrl.trim() || "http://localhost:4000/v1",
        model: aiModel.trim() || "gpt-4o-mini",
        apiKey: aiApiKey.trim() || undefined,
        headers,
      };

      const res = await completeChat(config, {
        model: config.model,
        messages: [
          {
            role: "system",
            content: "You are a connection tester. You must output the final answer in the message content field. Do not keep the final output empty.",
          },
          {
            role: "user",
            content: "Please confirm this connection by replying with 'OK' in your final response content.",
          },
        ],
        temperature: 0,
        max_tokens: 16,
        stream: false,
      });

      if (res && res.trim()) {
        setTestResult({
          ok: true,
          message: `Connection successful! Response preview: "${res.trim()}"`,
        });
      } else {
        setTestResult({
          ok: false,
          message: "The model returned an empty response.",
        });
      }
    } catch (error: any) {
      setTestResult({
        ok: false,
        message:
          error?.message ||
          "Could not reach the AI proxy. Check that it is running and CORS is enabled.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    let headers: Record<string, string> | undefined = undefined;
    if (aiHeaders.trim()) {
      try {
        headers = JSON.parse(aiHeaders.trim());
      } catch (e) {
        setTestResult({
          ok: false,
          message: "Could not save. Custom Headers has invalid JSON format.",
        });
        setActiveTab("ai");
        return;
      }
    }

    const aiConfig = aiBaseUrl.trim()
      ? {
          baseUrl: aiBaseUrl.trim(),
          model: aiModel.trim() || "gpt-4o-mini",
          apiKey: aiApiKey.trim() || undefined,
          headers,
        }
      : undefined;

    let parsed = {
      title: project.title || "",
      author: "",
      genre: "",
      pov: "Third Person Limited",
      tense: "Past",
      language: "en",
      targetWordCount: 50000,
      description: ""
    };

    try {
      const rawJson = project.projectMd || "";
      if (rawJson.trim().startsWith("{")) {
        parsed = { ...parsed, ...JSON.parse(rawJson) };
      }
    } catch {}

    const updatedProjectMd = JSON.stringify({
      ...parsed,
      title: title.trim() || "Untitled Project",
      author: author.trim(),
      genre: genre.trim(),
      pov: pov,
      tense: tense,
      language: language,
      targetWordCount: Number(targetWordCount) || 0,
      description: description.trim(),
    }, null, 2);

    onSave({
      title: title.trim() || "Untitled Project",
      projectMd: updatedProjectMd,
      ai: aiConfig,
    });
    onClose();
  };

  const handleClearAi = () => {
    setAiBaseUrl("");
    setAiModel("");
    setAiApiKey("");
    setAiHeaders("");
    setTestResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex h-[580px] w-[700px] flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-gray-800">
            Project Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close settings modal"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Content Tabs bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "ai"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            AI Connection
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Novel"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. J. K. Rowling"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Fantasy, Sci-Fi"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Point of View (POV)
                  </label>
                  <select
                    value={pov}
                    onChange={(e) => setPov(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Third Person Limited">Third Person Limited</option>
                    <option value="Third Person Omniscient">Third Person Omniscient</option>
                    <option value="First Person">First Person</option>
                    <option value="Second Person">Second Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Tense
                  </label>
                  <select
                    value={tense}
                    onChange={(e) => setTense(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Past">Past Tense</option>
                    <option value="Present">Present Tense</option>
                    <option value="Future">Future Tense</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Writing Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="en">English (EN)</option>
                    <option value="vi">Tiếng Việt (VI)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Target Word Count
                  </label>
                  <input
                    type="number"
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                    min={0}
                    step={1000}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Description / Premise
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of the main conflict, characters, and setting..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50/20 p-4">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                  Danger Zone
                </h4>
                <p className="text-xs leading-relaxed text-gray-600 mb-3">
                  Permanently delete all projects, chapters, voice style guides, character bibles, and reset the application to default settings. This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAll) {
                      onClearAll();
                      onClose();
                    }
                  }}
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
                >
                  Reset All Project Data
                </button>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-gray-500">
                NovelWrite connects directly to an OpenAI-compatible LLM proxy in your browser.
                Use <strong>LiteLLM</strong>, <strong>Ollama</strong>, <strong>LM Studio</strong>, <strong>vLLM</strong>, or your own private gateway.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Proxy Base URL
                  </label>
                  <input
                    type="text"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    placeholder="http://localhost:4000/v1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="gpt-4o-mini, llama3.1, qwen2.5, etc."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  API Key <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="Enter proxy or provider API key if required"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Custom Headers <span className="text-gray-400 font-normal lowercase">(optional JSON)</span>
                </label>
                <textarea
                  value={aiHeaders}
                  onChange={(e) => setAiHeaders(e.target.value)}
                  placeholder='{ "X-My-Header": "value" }'
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-800 focus:border-primary focus:outline-none font-mono resize-none"
                />
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-2 rounded-xl p-3 text-sm leading-relaxed border ${
                    testResult.ok
                      ? "border-green-100 bg-green-50 text-green-800"
                      : "border-red-100 bg-red-50 text-red-800"
                  }`}
                >
                  {testResult.ok ? (
                    <Check size={18} className="mt-0.5 shrink-0 text-green-600" />
                  ) : (
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div>
            {activeTab === "ai" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !aiBaseUrl.trim()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? (
                    <RefreshCw size={15} className="animate-spin text-gray-400" />
                  ) : (
                    <Play size={15} className="text-gray-400" />
                  )}
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleClearAi}
                  className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Save size={15} aria-hidden />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
