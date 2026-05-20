"use client";

import { useState } from "react";
import { User, Search, UserPlus } from "lucide-react";
import type { Character } from "@novelwrite/novel-agent";

type Props = {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function CharacterListSidebar({ characters = [], selectedId, onSelect, onAdd }: Props) {
  const [search, setSearch] = useState("");

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.aliases || []).some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
    (c.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 overflow-hidden h-full">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-gray-100 bg-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <User size={16} className="text-primary" />
            Characters ({characters.length})
          </h3>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <UserPlus size={13} />
            Add
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search characters..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-gray-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-gray-400">
            No characters found.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/5 border border-primary/10 shadow-sm"
                    : "border border-transparent hover:bg-gray-100/50"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <User size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-800 truncate">
                    {c.name}
                  </div>
                  {c.role && (
                    <div className="text-[10px] text-gray-500 truncate capitalize">
                      {c.role}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
