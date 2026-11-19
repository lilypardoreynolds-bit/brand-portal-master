import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, File, X, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FileUploader({ value, onChange, label = "Upload File" }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleUpload(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <File className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {label}
            </p>
            <p className="text-xs text-slate-500">Uploaded</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={value} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 text-slate-500" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange("")}>
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300 bg-white"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mx-auto" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">{label}</p>
              <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </div>
      )}
    </div>
  );
}