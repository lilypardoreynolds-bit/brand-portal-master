import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
        )}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-p:text-slate-700 prose-strong:text-slate-800 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:my-0.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {message.label && !isUser && (
          <span className="text-[10px] text-slate-400 mt-1 px-1">{message.label}</span>
        )}
      </div>
      {isUser && (
        <div className="h-7 w-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5 text-slate-600" />
        </div>
      )}
    </div>
  );
}