"use client";

import { useEffect, useState, useRef } from "react";
import { User, Eye, EyeOff, Shield, ArrowUpRight } from "lucide-react";
import type { CharactersDocument, Character } from "@novelwrite/novel-agent";

type Props = {
  charactersDoc: CharactersDocument;
};

export function CharacterHoverCard({ charactersDoc }: Props) {
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest(".character-mark") as HTMLElement | null;

      if (!mark) {
        // If mouse is inside the popover itself, keep it open
        const insidePopover = target.closest(".character-hover-card");
        if (insidePopover) {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
          return;
        }
        
        // Trigger exit timer
        triggerExit();
        return;
      }

      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      
      const charName = mark.getAttribute("data-char-name");
      if (!charName) return;

      // Find character in document
      const char = charactersDoc.characters.find(
        (c) =>
          c.name.toLowerCase() === charName.toLowerCase() ||
          (c.aliases || []).some((a) => a.toLowerCase() === charName.toLowerCase())
      );

      if (!char) return;

      currentTargetRef.current = mark;
      setActiveChar(char);
      setRevealSecret(false);

      // Calculate absolute coordinate alignment
      const rect = mark.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Position centered above the span
      setPosition({
        top: rect.top + scrollY - 140, // standard offset above target
        left: rect.left + scrollX + rect.width / 2,
      });
    };

    const handleMouseOut = () => {
      triggerExit();
    };

    const triggerExit = () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        setActiveChar(null);
        setPosition(null);
        currentTargetRef.current = null;
      }, 350); // grace period for hover bridging
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [charactersDoc]);

  if (!activeChar || !position) return null;

  const handleOpen = () => {
    window.dispatchEvent(
      new CustomEvent("novelwrite:openCharacter", { detail: { charName: activeChar.name } })
    );
    setActiveChar(null);
    setPosition(null);
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
      className="character-hover-card w-64 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl shadow-lg p-4 space-y-3 pointer-events-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-150"
      onMouseEnter={() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      }}
      onMouseLeave={() => {
        setActiveChar(null);
        setPosition(null);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <User size={14} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-800 truncate">{activeChar.name}</h4>
            {activeChar.role && (
              <span className="inline-block text-[9px] font-semibold text-gray-400 capitalize truncate max-w-[120px]">
                {activeChar.role}
              </span>
            )}
          </div>
        </div>
        
        {/* Open details arrow */}
        <button
          type="button"
          onClick={handleOpen}
          className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
          title="Open Profile Card"
        >
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Traits */}
      {(activeChar.traits || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeChar.traits?.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[9px] font-semibold bg-gray-50 border border-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Age / Appearance snippet */}
      {(activeChar.age || activeChar.appearance) && (
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed bg-gray-50/50 p-1.5 rounded border border-gray-100/30">
          {activeChar.age ? `Age ${activeChar.age}. ` : ""}
          {activeChar.appearance || "No description provided."}
        </p>
      )}

      {/* Secrets Spoiler Box */}
      {(activeChar.secrets || []).length > 0 && (
        <div className="pt-2 border-t border-gray-100 flex items-start justify-between gap-2 text-[10px]">
          <div className="flex-1 min-w-0">
            <span className="font-bold text-red-600 block mb-0.5 uppercase tracking-wider text-[8px]">
              Secret Alert
            </span>
            {revealSecret ? (
              <p className="text-gray-600 font-medium leading-relaxed italic bg-red-50/30 border border-red-100/50 p-1.5 rounded animate-in fade-in duration-200">
                {activeChar.secrets?.[0]}
              </p>
            ) : (
              <p className="text-gray-400 select-none italic">Secret is masked.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRevealSecret(!revealSecret)}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-3 cursor-pointer"
          >
            {revealSecret ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}
