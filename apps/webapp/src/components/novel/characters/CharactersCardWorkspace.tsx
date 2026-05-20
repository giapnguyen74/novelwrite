"use client";

import { useState, useMemo } from "react";
import { User, CheckSquare, Square, ArrowRight, Sparkles, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import type { CharactersDocument, Character } from "@novelwrite/novel-agent";
import { generateCharacterId, migrateFromMarkdown } from "@novelwrite/novel-agent";
import { CharacterListSidebar } from "./CharacterListSidebar";
import { CharacterCard } from "./CharacterCard";

type Props = {
  charactersDoc: CharactersDocument;
  hasCharactersJson: boolean;
  legacyCharactersMd: string;
  updateCharacters: (updater: (doc: CharactersDocument) => void) => void;
  saveMigratedCharacters: (doc: CharactersDocument) => void;
  onViewMarkdown: () => void;
};

export function CharactersCardWorkspace({
  charactersDoc,
  hasCharactersJson,
  legacyCharactersMd,
  updateCharacters,
  saveMigratedCharacters,
  onViewMarkdown,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissedMigration, setDismissedMigration] = useState(false);

  // Parse legacy markdown for preview during migration
  const parsedMigrationDoc = useMemo(() => {
    if (hasCharactersJson) return null;
    try {
      return migrateFromMarkdown(legacyCharactersMd);
    } catch {
      return { schemaVersion: 1, characters: [] };
    }
  }, [hasCharactersJson, legacyCharactersMd]);

  // Track checked characters for migration
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  // Initialize checked characters once parsed migration document is ready
  useMemo(() => {
    if (parsedMigrationDoc) {
      const initial: Record<string, boolean> = {};
      parsedMigrationDoc.characters.forEach((c) => {
        initial[c.id] = true;
      });
      setCheckedIds(initial);
    }
  }, [parsedMigrationDoc]);

  const activeCharacter = useMemo(() => {
    if (!selectedId) return null;
    return charactersDoc.characters.find((c) => c.id === selectedId) || null;
  }, [selectedId, charactersDoc.characters]);

  // Handle adding new empty character card
  const handleAddCharacter = () => {
    const newId = generateCharacterId();
    const newChar: Character = {
      id: newId,
      name: "New Character",
      aliases: [],
      role: "supporting",
      age: "",
      appearance: "",
      voice: "",
      coreDesire: "",
      coreFear: "",
      secrets: [],
      traits: [],
      relationships: [],
      tags: [],
      importantFacts: [],
      evidence: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateCharacters((doc) => {
      doc.characters.push(newChar);
    });
    setSelectedId(newId);
  };

  // Handle updates to specific character
  const handleUpdateCharacter = (updated: Character) => {
    updateCharacters((doc) => {
      const idx = doc.characters.findIndex((c) => c.id === updated.id);
      if (idx !== -1) {
        doc.characters[idx] = updated;
      }
    });
  };

  // Handle deleting a character
  const handleDeleteCharacter = (id: string) => {
    updateCharacters((doc) => {
      doc.characters = doc.characters.filter((c) => c.id !== id);
    });
    setSelectedId(null);
  };

  // Perform migration transition
  const handleMigrate = () => {
    if (!parsedMigrationDoc) return;
    const selectedCharacters = parsedMigrationDoc.characters.filter((c) => checkedIds[c.id]);
    const migratedDoc: CharactersDocument = {
      schemaVersion: 1,
      characters: selectedCharacters,
    };
    saveMigratedCharacters(migratedDoc);
    if (selectedCharacters.length > 0) {
      setSelectedId(selectedCharacters[0].id);
    }
  };

  // If no Characters.json exists and we haven't dismissed the migration yet, render the Migration split screen
  if (!hasCharactersJson && !dismissedMigration && legacyCharactersMd.trim().length > 30) {
    const incomingChars = parsedMigrationDoc?.characters || [];
    
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 p-6 lg:p-8 animate-in fade-in duration-300">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-md font-extrabold flex items-center gap-2">
                <Sparkles className="animate-pulse text-yellow-300 shrink-0" size={20} />
                Upgrade to Modern Character Cards
              </h3>
              <p className="text-xs text-purple-100 max-w-2xl">
                We've parsed your legacy <strong>Characters.md</strong> file into a clean, structured database. Confirm which characters you would like to import into our new cards‑based editor below.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleMigrate}
                className="bg-white text-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                Convert to Cards
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDismissedMigration(true)}
                className="bg-primary/20 text-white border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/30 transition-all cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>

          {/* Side-by-side migration preview */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            {/* Left Column: Original Markdown view */}
            <div className="border border-gray-200 rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <FileText size={15} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-700">Original Characters.md</span>
              </div>
              <textarea
                readOnly
                value={legacyCharactersMd}
                className="flex-1 p-5 text-xs font-mono text-gray-500 bg-gray-50/10 resize-none outline-none overflow-y-auto"
              />
            </div>

            {/* Right Column: Parsed Cards checkboxes */}
            <div className="border border-gray-200 rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-primary" />
                  <span className="text-xs font-bold text-gray-700">Parsed Character Profile Cards ({incomingChars.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = incomingChars.every((c) => checkedIds[c.id]);
                    const next: Record<string, boolean> = {};
                    incomingChars.forEach((c) => {
                      next[c.id] = !allChecked;
                    });
                    setCheckedIds(next);
                  }}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {incomingChars.every((c) => checkedIds[c.id]) ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Parsed list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {incomingChars.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 italic">
                    Could not parse any character blocks. Try skipping to customize manually.
                  </div>
                ) : (
                  incomingChars.map((c) => {
                    const checked = !!checkedIds[c.id];
                    return (
                      <div
                        key={c.id}
                        onClick={() => setCheckedIds((prev) => ({ ...prev, [c.id]: !checked }))}
                        className={`p-3.5 border rounded-xl flex items-start gap-3.5 cursor-pointer transition-all select-none ${
                          checked
                            ? "border-primary/20 bg-primary/5/20 shadow-sm"
                            : "border-gray-100 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${checked ? "text-primary" : "text-gray-300"}`}>
                          {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            {c.name}
                            {c.role && (
                              <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">
                                {c.role}
                              </span>
                            )}
                          </h4>
                          {(c.aliases || []).length > 0 && (
                            <p className="text-[10px] text-gray-400 truncate">
                              Aliases: {c.aliases?.join(", ")}
                            </p>
                          )}
                          {(c.traits || []).length > 0 && (
                            <p className="text-[10px] text-gray-400 truncate">
                              Traits: {c.traits?.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cards layout
  return (
    <div className="flex-1 flex overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-inner h-full">
      {/* List Sidebar */}
      <CharacterListSidebar
        characters={charactersDoc.characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={handleAddCharacter}
      />

      {/* Editor Details View */}
      {activeCharacter ? (
        <CharacterCard
          character={activeCharacter}
          onUpdate={handleUpdateCharacter}
          onDelete={handleDeleteCharacter}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/10">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 animate-bounce duration-1000">
            <User size={32} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">Select a Character</h3>
          <p className="text-xs text-gray-400 max-w-sm mb-4">
            Pick a character profile from the list to view, edit traits, update secrets, and track story quotes, or add a brand new profile card.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddCharacter}
              className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
            >
              Add New Character
            </button>
            {!hasCharactersJson && (
              <button
                type="button"
                onClick={() => setDismissedMigration(false)}
                className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
              >
                Run Migration Wizard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
