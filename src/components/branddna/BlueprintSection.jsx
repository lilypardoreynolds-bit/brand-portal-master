import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function BlueprintSection({ icon: IconComponent, title, content, color = "indigo", isEmpty }) {
  const Icon = IconComponent;
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", colorMap[color])}>
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty || !content ? (
          <p className="text-sm text-slate-300 italic">Not generated yet</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-p:text-slate-700 prose-strong:text-slate-800 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:my-0.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}