"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

type Props = {
  values: string[];
  onChange: (newValues: string[]) => void;
  placeholder?: string;
};

export function ChipInput({ values = [], onChange, placeholder = "Add item..." }: Props) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim();
      if (val && !values.includes(val)) {
        onChange([...values, val]);
      }
      setInput("");
    }
  };

  const handleBlur = () => {
    const val = input.trim();
    if (val && !values.includes(val)) {
      onChange([...values, val]);
    }
    setInput("");
  };

  const removeValue = (val: string) => {
    onChange(values.filter((v) => v !== val));
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-white hover:border-primary focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs font-semibold px-2 py-0.5 rounded-md border border-primary/10 select-none transition-all duration-150 hover:bg-primary hover:text-white"
        >
          {v}
          <button
            type="button"
            onClick={() => removeValue(v)}
            className="hover:bg-black/10 rounded px-0.5 transition-colors cursor-pointer"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400 focus:ring-0"
      />
    </div>
  );
}
