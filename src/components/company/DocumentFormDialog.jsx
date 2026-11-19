import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import FileUploader from "@/components/shared/FileUploader";

const categoryFields = {
  formation: {
    label: "Company Formation",
    fields: [
      { key: "state", label: "State", type: "text" },
      { key: "formation_date", label: "Formation Date", type: "date" },
      { key: "registration_number", label: "Registration Number", type: "text" },
    ],
    uploads: ["Articles of Organization", "Operating Agreement"],
  },
  ein: {
    label: "EIN",
    fields: [
      { key: "ein_number", label: "EIN Number", type: "text" },
      { key: "ein_issue_date", label: "Issue Date", type: "date" },
    ],
    uploads: ["EIN Confirmation Letter (CP575)"],
  },
  bank_account: {
    label: "Business Bank Account",
    fields: [
      { key: "bank_name", label: "Bank Name", type: "text" },
      { key: "account_type", label: "Account Type", type: "select", options: ["Checking", "Savings", "Business Checking", "Business Savings"] },
      { key: "last_4_digits", label: "Last 4 Digits", type: "text" },
    ],
    uploads: ["Bank Letter", "Void Check"],
  },
  trademark: {
    label: "Trademark",
    fields: [
      { key: "trademark_name", label: "Trademark Name", type: "text" },
      { key: "application_number", label: "Application Number", type: "text" },
      { key: "trademark_app_status", label: "Status", type: "select", options: ["Filed", "Under Review", "Published", "Registered", "Rejected"] },
    ],
    uploads: ["Trademark Application", "Trademark Certificate"],
  },
  resale_certificate: {
    label: "Resale Certificate",
    fields: [
      { key: "state", label: "State", type: "text" },
      { key: "certificate_number", label: "Certificate Number", type: "text" },
      { key: "business_partner_number", label: "Business Partner Number", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiration_date", label: "Expiration Date", type: "date" },
    ],
    uploads: ["Certificate Document"],
  },
  lease: {
    label: "Business Address Lease",
    fields: [
      { key: "address", label: "Address", type: "text" },
      { key: "lease_type", label: "Lease Type", type: "select", options: ["Virtual Office", "Warehouse", "Office", "Retail", "Co-working"] },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "expiration_date", label: "Expiration Date", type: "date" },
      { key: "monthly_payment", label: "Monthly Payment ($)", type: "number" },
      { key: "login_username", label: "Portal Username", type: "text", virtualOnly: true },
      { key: "login_password", label: "Portal Password", type: "password", virtualOnly: true },
    ],
    uploads: ["Lease Agreement", "Utility Bill"],
  },
  phone: {
    label: "Corporate Phone",
    fields: [
      { key: "phone_number", label: "Phone Number", type: "text" },
      { key: "provider", label: "Provider", type: "text" },
      { key: "phone_type", label: "Type", type: "select", options: ["VOIP", "Mobile", "Call Center", "Landline"] },
      { key: "phone_payment_amount", label: "Payment Amount ($)", type: "number" },
      { key: "phone_payment_frequency", label: "Payment Frequency", type: "select", options: ["Monthly", "Annual"] },
    ],
    uploads: ["Service Agreement"],
  },
  email_account: {
    label: "Email Account",
    fields: [
      { key: "platform", label: "Platform", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "password", label: "Password", type: "password" },
    ],
    uploads: [],
  },
  alibaba_account: {
    label: "Alibaba Account",
    fields: [
      { key: "email", label: "Email / Username", type: "text" },
      { key: "password", label: "Password", type: "password" },
      { key: "platform", label: "Platform / Notes", type: "text" },
    ],
    uploads: [],
  },
  gs1_account: {
    label: "GS1 Account",
    fields: [
      { key: "gs1_username", label: "Username / Email", type: "text" },
      { key: "gs1_password", label: "Password", type: "password" },
      { key: "gs1_prefix", label: "GS1 Company Prefix", type: "text" },
      { key: "gs1_renewal_date", label: "Renewal Date", type: "date" },
    ],
    uploads: [],
  },
  password_board: {
    label: "Password Board",
    fields: [
      { key: "document_name", label: "Platform / Service Name", type: "text" },
      { key: "pb_url", label: "Website / URL", type: "text" },
      { key: "pb_username", label: "Username / Email", type: "text" },
      { key: "pb_password", label: "Password", type: "password" },
    ],
    uploads: [],
  },
};

export default function DocumentFormDialog({ open, onClose, category, companyId, onSave, editDoc }) {
  const config = categoryFields[category];
  const [form, setForm] = useState(() => editDoc ? { ...editDoc } : { document_name: config?.uploads?.[0] || "" });
  const [fileUrl, setFileUrl] = useState(editDoc?.file_url || "");
  const [saving, setSaving] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState(editDoc?.document_name || config?.uploads?.[0] || "");
  const isVirtualOffice = category === "lease" && form["lease_type"] === "Virtual Office";

  if (!config) return null;

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const fieldData = Object.fromEntries(config.fields.map((f) => [f.key, form[f.key] || ""]));
    await onSave({
      company_id: companyId,
      category,
      document_name: fieldData.document_name || selectedUploadType || config.label,
      file_url: fileUrl,
      notes: form.notes || "",
      ...fieldData,
    });
    setSaving(false);
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editDoc ? "Edit" : "Add"} {config.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {config.fields.map((field) => {
            if (field.virtualOnly && !isVirtualOffice) return null;
            return (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                {field.type === "select" ? (
                  <Select value={form[field.key] || ""} onValueChange={(v) => update(field.key, v)}>
                    <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                    <SelectContent>
                      {field.options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "date" ? (
                  <Input type="date" value={form[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} />
                ) : field.type === "password" ? (
                  <Input type="text" value={form[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} />
                ) : field.type === "number" ? (
                  <Input type="number" value={form[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} />
                ) : (
                  <Input value={form[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} />
                )}
              </div>
            );
          })}

          {config.uploads.length > 1 && category !== "lease" && (
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <Select value={selectedUploadType} onValueChange={setSelectedUploadType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {config.uploads.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isVirtualOffice && config.uploads.length > 0 && (
            <FileUploader value={fileUrl} onChange={setFileUrl} label={`Upload ${selectedUploadType}`} />
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editDoc ? "Update Document" : "Save Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}