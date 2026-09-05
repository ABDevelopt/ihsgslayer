"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface GlossaryTooltipProps {
  term: string;
  definition: string;
  example?: string;
  variant?: "icon" | "underline";
  color?: string;
}

export default function GlossaryTooltip({
  term,
  definition,
  example,
  variant = "icon",
  color = "text-slate-400",
}: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (variant === "underline") {
    return (
      <span className="relative inline-block" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="border-b border-dashed border-current text-inherit cursor-help"
          title={definition}
        >
          {term}
        </button>
        {open && (
          <TooltipPopover term={term} definition={definition} example={example} onClose={() => setOpen(false)} />
        )}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-0.5 rounded-full hover:bg-slate-700/50 transition-colors ${color}`}
        title={`Apa itu ${term}?`}
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {open && (
        <TooltipPopover term={term} definition={definition} example={example} onClose={() => setOpen(false)} />
      )}
    </span>
  );
}

function TooltipPopover({
  term,
  definition,
  example,
  onClose,
}: {
  term: string;
  definition: string;
  example?: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 animate-in fade-in zoom-in-95 duration-150">
      <div className="pg-surface border pg-divider rounded-xl shadow-2xl p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono font-bold text-xs pg-emerald">{term}</span>
          <button
            onClick={onClose}
            className="text-[10px] pg-text-faint hover:pg-text font-mono px-1 rounded"
          >
            x
          </button>
        </div>
        <p className="text-[11px] pg-text-3 leading-relaxed">{definition}</p>
        {example && (
          <div className="text-[10px] pg-muted border pg-divider rounded-lg px-2 py-1.5 pg-text-muted font-mono">
            Contoh: {example}
          </div>
        )}
      </div>
    </div>
  );
}
