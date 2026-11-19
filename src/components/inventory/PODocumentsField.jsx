import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { File, Paperclip, Loader2, Eye, X } from "lucide-react";

export default function PODocumentsField({ documents = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      uploaded.push({ name: file.name, file_uri });
    }
    onChange([...(documents || []), ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const openDoc = async (doc, idx) => {
    setOpening(idx);
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: doc.file_uri,
      expires_in: 300,
    });
    window.open(signed_url, "_blank", "noopener,noreferrer");
    setOpening(null);
  };

  const remove = (idx) => onChange(documents.filter((_, i) => i !== idx));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Documents</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          Attach Document
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-slate-400">
          No documents attached. Add supplier invoices, packing lists, receipts or quotes.
        </p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
              <File className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-slate-700 truncate">{d.name || "Document"}</span>
              <button
                type="button"
                onClick={() => openDoc(d, idx)}
                className="text-slate-400 hover:text-slate-600"
                title="Open"
              >
                {opening === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500" title="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
