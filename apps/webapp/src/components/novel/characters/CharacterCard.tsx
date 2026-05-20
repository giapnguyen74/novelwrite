"use client";

import { useState } from "react";
import { User, Trash2, Calendar, Shield, HelpCircle, Eye, EyeOff, BookOpen, Quote } from "lucide-react";
import type { Character } from "@novelwrite/novel-agent";
import { ChipInput } from "./ChipInput";

type Props = {
  character: Character;
  onUpdate: (updated: Character) => void;
  onDelete: (id: string) => void;
};

export function CharacterCard({ character, onUpdate, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const updateField = (key: keyof Character, value: any) => {
    onUpdate({
      ...character,
      [key]: value,
    });
  };

  const evidenceList = character.evidence || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-white h-full relative">
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
            <User size={24} />
          </div>
          <div className="space-y-1">
            <input
              type="text"
              value={character.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="text-lg font-bold text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 focus:ring-2 focus:ring-primary/10 rounded px-2 -ml-2 w-full max-w-[320px] md:max-w-[400px] transition-all"
              placeholder="Character Name..."
            />
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">ID: {character.id}</p>
          </div>
        </div>

        {/* Delete Trigger */}
        <div className="relative">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Delete Character"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-1.5 shadow-sm animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-red-600 px-1">Sure?</span>
              <button
                type="button"
                onClick={() => onDelete(character.id)}
                className="bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded hover:bg-red-700 cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 text-[10px] font-semibold px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Core Properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            Role
          </label>
          <input
            type="text"
            value={character.role || ""}
            onChange={(e) => updateField("role", e.target.value)}
            placeholder="e.g. Protagonist, Mentor..."
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:border-primary focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            Age
          </label>
          <input
            type="text"
            value={character.age || ""}
            onChange={(e) => updateField("age", e.target.value)}
            placeholder="e.g. 28, Early thirties..."
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:bg-white focus:border-primary focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Aliases */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            Aliases / Alternative Names
          </label>
          <ChipInput
            values={character.aliases || []}
            onChange={(vals) => updateField("aliases", vals)}
            placeholder="Type and press Enter to add aliases..."
          />
        </div>

        {/* Traits */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            Traits / Keywords
          </label>
          <ChipInput
            values={character.traits || []}
            onChange={(vals) => updateField("traits", vals)}
            placeholder="e.g. stubborn, rational, impulsive..."
          />
        </div>
      </div>

      {/* Narrative & Description Fields */}
      <div className="space-y-6">
        {/* Appearance */}
        <div className="space-y-2 border-l-2 border-primary/20 pl-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Appearance</h4>
          <textarea
            value={character.appearance || ""}
            onChange={(e) => updateField("appearance", e.target.value)}
            placeholder="Describe physical features, posture, clothing style, key scars or identifiers..."
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-3 bg-gray-50/50 focus:bg-white focus:border-primary focus:outline-none transition-all duration-200 h-20 resize-none"
          />
        </div>

        {/* Voice & Speech */}
        <div className="space-y-2 border-l-2 border-primary/20 pl-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Voice & Speech Patterns</h4>
          <textarea
            value={character.voice || ""}
            onChange={(e) => updateField("voice", e.target.value)}
            placeholder="Tone, rhythm, preferred pronouns, dialect/accents, signature catchphrases..."
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-3 bg-gray-50/50 focus:bg-white focus:border-primary focus:outline-none transition-all duration-200 h-20 resize-none"
          />
        </div>

        {/* Core Desire */}
        <div className="space-y-2 border-l-2 border-purple-500/20 pl-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600">Core Desire</h4>
          <textarea
            value={character.coreDesire || ""}
            onChange={(e) => updateField("coreDesire", e.target.value)}
            placeholder="What drives this character? What is their fundamental narrative goal?"
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-3 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:outline-none transition-all duration-200 h-20 resize-none"
          />
        </div>

        {/* Core Fear */}
        <div className="space-y-2 border-l-2 border-purple-500/20 pl-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600">Core Fear</h4>
          <textarea
            value={character.coreFear || ""}
            onChange={(e) => updateField("coreFear", e.target.value)}
            placeholder="What are they avoiding at all costs? What is their deepest vulnerability?"
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-3 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:outline-none transition-all duration-200 h-20 resize-none"
          />
        </div>

        {/* Secrets */}
        <div className="space-y-2 border-l-2 border-red-500/20 pl-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5 select-none">
              Secrets & Hidden Motives
            </h4>
            <button
              type="button"
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer select-none"
            >
              {showSecrets ? <EyeOff size={12} /> : <Eye size={12} />}
              {showSecrets ? "Hide secrets" : "Reveal secrets"}
            </button>
          </div>

          {showSecrets ? (
            <ChipInput
              values={character.secrets || []}
              onChange={(vals) => updateField("secrets", vals)}
              placeholder="e.g. Secret identity, treason, guilt..."
            />
          ) : (
            <div className="p-3 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 text-center select-none bg-gray-50/30">
              Secrets are masked to prevent accidental spoilers. Click "Reveal secrets" to view/edit.
            </div>
          )}
        </div>

        {/* Important Facts */}
        <div className="space-y-2 border-l-2 border-amber-500/20 pl-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600">Important Facts / Background</h4>
          <ChipInput
            values={character.importantFacts || []}
            onChange={(vals) => updateField("importantFacts", vals)}
            placeholder="Type a key fact and press Enter (e.g. Ex-solider, raised in the slums)..."
          />
        </div>
      </div>

      {/* Evidence Quotes Timeline */}
      <div className="pt-6 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5 select-none">
          <BookOpen size={14} />
          Story Evidence & Quotes ({evidenceList.length})
        </h4>

        {evidenceList.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No quotes captured from writing drafts yet.</p>
        ) : (
          <div className="relative border-l border-gray-100 ml-2.5 pl-5 space-y-4">
            {evidenceList.map((ev, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border border-white bg-primary/20 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                
                {/* Quote details */}
                <div className="space-y-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50 rounded-xl p-3.5 transition-all">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold select-none">
                    <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1 capitalize">
                      <Quote size={8} /> {ev.chapterId ? ev.chapterId.replace("chapter-", "Chapter ") : "Story text"}
                    </span>
                    {ev.addedAt && <span>{new Date(ev.addedAt).toLocaleDateString()}</span>}
                  </div>
                  <blockquote className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-3 leading-relaxed">
                    "{ev.quote}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
