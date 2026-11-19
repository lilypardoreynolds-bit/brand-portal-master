import React from "react";

const PROMPTS = [
  "Create a marketing campaign for this brand",
  "Generate Instagram content ideas",
  "Suggest pricing improvements",
  "Analyze sales performance",
  "Suggest new product ideas",
  "What products should I bundle together?",
  "Write a brand positioning statement",
  "How can I improve customer retention?",
];

export default function SuggestedPrompts({ onSelect, loading }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMPTS.map((p) => (
        <button
          key={p}
          disabled={loading}
          onClick={() => onSelect(p)}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all disabled:opacity-50"
        >
          {p}
        </button>
      ))}
    </div>
  );
}