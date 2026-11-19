import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Plus, Eye, Pencil } from "lucide-react";

const CATEGORY_DISPLAY = {
  formation: [
    { key: "state", label: "State" },
    { key: "formation_date", label: "Formation Date" },
    { key: "registration_number", label: "Reg. Number" },
  ],
  ein: [
    { key: "ein_number", label: "EIN Number" },
    { key: "ein_issue_date", label: "Issue Date" },
  ],
  bank_account: [
    { key: "bank_name", label: "Bank" },
    { key: "account_type", label: "Account Type" },
    { key: "last_4_digits", label: "Last 4 Digits" },
  ],
  trademark: [
    { key: "trademark_name", label: "Trademark" },
    { key: "application_number", label: "App Number" },
    { key: "trademark_app_status", label: "Status" },
  ],
  resale_certificate: [
    { key: "state", label: "State" },
    { key: "certificate_number", label: "Certificate #" },
    { key: "business_partner_number", label: "BP Number" },
    { key: "issue_date", label: "Issue Date" },
    { key: "expiration_date", label: "Expires" },
  ],
  lease: [
    { key: "address", label: "Address" },
    { key: "lease_type", label: "Type" },
    { key: "start_date", label: "Start Date" },
    { key: "expiration_date", label: "Expires" },
    { key: "monthly_payment", label: "Monthly", format: (v) => v ? `$${v}/mo` : null },
    { key: "login_username", label: "Username" },
    { key: "login_password", label: "Password" },
  ],
  phone: [
    { key: "phone_number", label: "Phone" },
    { key: "provider", label: "Provider" },
    { key: "phone_type", label: "Type" },
    { key: "phone_payment_amount", label: "Payment", format: (v) => v ? `$${v}` : null },
    { key: "phone_payment_frequency", label: "Frequency" },
  ],
  email_account: [
    { key: "platform", label: "Platform" },
    { key: "email", label: "Email" },
    { key: "password", label: "Password" },
  ],
  alibaba_account: [
    { key: "email", label: "Email / Username" },
    { key: "password", label: "Password" },
    { key: "platform", label: "Notes" },
  ],
  gs1_account: [
    { key: "gs1_username", label: "Username" },
    { key: "gs1_password", label: "Password" },
    { key: "gs1_prefix", label: "Company Prefix" },
    { key: "gs1_renewal_date", label: "Renewal Date" },
  ],
  password_board: [
    { key: "pb_url", label: "Website / URL" },
    { key: "pb_username", label: "Username / Email" },
    { key: "pb_password", label: "Password" },
  ],
};

function DocDetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-xs text-slate-700 font-semibold text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export default function DocumentCategoryCard({ title, icon: Icon, status, documents, category, onAdd, onEdit }) {
  const displayFields = CATEGORY_DISPLAY[category] || [];

  return (
    <Card className="border-slate-200 hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {status && (
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 group relative">
                {/* Actions */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
                    </a>
                  )}
                  <button onClick={() => onEdit(doc)}>
                    <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
                  </button>
                </div>

                {/* Doc name header */}
                <p className="text-xs font-semibold text-slate-600 mb-2 pr-12 truncate">{doc.document_name}</p>

                {/* Fields */}
                <div>
                  {displayFields.map((field) => {
                    const raw = doc[field.key];
                    const value = field.format ? field.format(raw) : raw;
                    return <DocDetailRow key={field.key} label={field.label} value={value} />;
                  })}
                  {doc.notes && <DocDetailRow label="Notes" value={doc.notes} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}