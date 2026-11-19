import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const ENTITY_TYPES = ["LLC", "Corporation", "Non Profit", "Sole Proprietorship", "Partnership"];

const EMPTY_FORM = {
  company_name: "", brand_name: "", entity_type: "LLC",
  state_of_registration: "", country: "United States",
  formation_date: "", registration_number: "", ein: "",
  business_address: "", business_city: "", business_state: "", business_zip: "",
  phone_number: "", website: "", notes: "",
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function ReadValue({ value }) {
  return (
    <p className="text-sm font-medium text-slate-900 min-h-[2rem] flex items-center">
      {value || <span className="text-slate-400 font-normal">—</span>}
    </p>
  );
}

export default function CompanyProfile() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["company_profile"],
    queryFn: () => base44.entities.Company.list("-created_date", 1),
    initialData: [],
  });

  const company = companies[0];

  useEffect(() => {
    if (company) setForm({ ...EMPTY_FORM, ...company });
  }, [company]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company_profile"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(company.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company_profile"] }),
  });

  const handleSave = async () => {
    if (company) {
      await updateMutation.mutateAsync(form);
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(company ? { ...EMPTY_FORM, ...company } : EMPTY_FORM);
    setEditing(false);
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">
              {(form.brand_name || form.company_name || "B").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {form.brand_name || form.company_name || "Company Profile"}
            </h2>
            {form.entity_type && (
              <p className="text-sm text-slate-500 mt-0.5">
                {form.entity_type}{form.state_of_registration ? ` · ${form.state_of_registration}` : ""}
                {form.ein ? ` · EIN: ${form.ein}` : ""}
              </p>
            )}
          </div>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.company_name} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {!company && !editing && (
        <Card className="border-dashed border-indigo-300 bg-indigo-50/50">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <Building2 className="h-10 w-10 text-indigo-300 mb-3" />
            <p className="font-semibold text-slate-700">No company profile yet</p>
            <p className="text-sm text-slate-500 mt-1">Set up your brand's company information to get started.</p>
            <Button onClick={() => setEditing(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {(company || editing) && (
        <>
          {/* Legal Identity */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-900">Legal Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Company Name">
                {editing ? (
                  <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="Legal company name" />
                ) : <ReadValue value={company?.company_name} />}
              </Field>
              <Field label="Brand Name">
                {editing ? (
                  <Input value={form.brand_name} onChange={(e) => update("brand_name", e.target.value)} placeholder="DBA / Brand name" />
                ) : <ReadValue value={company?.brand_name} />}
              </Field>
              <Field label="Entity Type">
                {editing ? (
                  <Select value={form.entity_type} onValueChange={(v) => update("entity_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <ReadValue value={company?.entity_type} />}
              </Field>
              <Field label="State of Registration">
                {editing ? (
                  <Select value={form.state_of_registration} onValueChange={(v) => update("state_of_registration", v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <ReadValue value={company?.state_of_registration} />}
              </Field>
              <Field label="Country">
                {editing ? (
                  <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
                ) : <ReadValue value={company?.country} />}
              </Field>
              <Field label="Formation Date">
                {editing ? (
                  <Input type="date" value={form.formation_date} onChange={(e) => update("formation_date", e.target.value)} />
                ) : <ReadValue value={company?.formation_date} />}
              </Field>
              <Field label="Registration Number">
                {editing ? (
                  <Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} />
                ) : <ReadValue value={company?.registration_number} />}
              </Field>
              <Field label="EIN">
                {editing ? (
                  <Input value={form.ein} onChange={(e) => update("ein", e.target.value)} placeholder="XX-XXXXXXX" />
                ) : <ReadValue value={company?.ein} />}
              </Field>
            </CardContent>
          </Card>

          {/* Contact & Operations */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-900">Contact & Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Address (Street & Unit)">
                  {editing ? (
                    <Input value={form.business_address} onChange={(e) => update("business_address", e.target.value)} placeholder="Street address and unit number" />
                  ) : <ReadValue value={company?.business_address} />}
                </Field>
                <Field label="City">
                  {editing ? (
                    <Input value={form.business_city} onChange={(e) => update("business_city", e.target.value)} placeholder="City" />
                  ) : <ReadValue value={company?.business_city} />}
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="State">
                  {editing ? (
                    <Select value={form.business_state} onValueChange={(v) => update("business_state", v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : <ReadValue value={company?.business_state} />}
                </Field>
                <Field label="Zip Code">
                  {editing ? (
                    <Input value={form.business_zip} onChange={(e) => update("business_zip", e.target.value)} placeholder="Zip code" />
                  ) : <ReadValue value={company?.business_zip} />}
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Corporate Phone">
                  {editing ? (
                    <Input value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} placeholder="+1 (000) 000-0000" />
                  ) : <ReadValue value={company?.phone_number} />}
                </Field>
                <Field label="Website">
                  {editing ? (
                    <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
                  ) : (
                    company?.website
                      ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{company.website}</a>
                      : <ReadValue value={null} />
                  )}
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-900">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={4}
                  placeholder="Internal notes about this brand or client..."
                />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {company?.notes || <span className="text-slate-400">No notes added.</span>}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}