import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, CreditCard, Landmark, ShieldCheck, Building2, MapPin, Phone, Loader2, Mail, ShoppingBag, Barcode, KeyRound
} from "lucide-react";
import DocumentCategoryCard from "@/components/company/DocumentCategoryCard";
import DocumentFormDialog from "@/components/company/DocumentFormDialog";

const CATEGORY_CONFIG = [
  { key: "formation", label: "Company Formation", icon: FileText, statusKey: "formation_status" },
  { key: "ein", label: "EIN", icon: CreditCard, statusKey: "ein_status" },
  { key: "bank_account", label: "Business Bank Account", icon: Landmark, statusKey: "bank_status" },
  { key: "trademark", label: "Trademark", icon: ShieldCheck, statusKey: "trademark_status" },
  { key: "resale_certificate", label: "Resale Certificate", icon: Building2, statusKey: "resale_cert_status" },
  { key: "lease", label: "Business Address Lease", icon: MapPin, statusKey: "lease_status" },
  { key: "phone", label: "Corporate Phone", icon: Phone, statusKey: "phone_status" },
  { key: "email_account", label: "Email Account", icon: Mail, statusKey: "email_account_status" },
  { key: "alibaba_account", label: "Alibaba Account", icon: ShoppingBag, statusKey: "alibaba_account_status" },
  { key: "gs1_account", label: "GS1 Account", icon: Barcode, statusKey: "gs1_account_status" },
  { key: "password_board", label: "Password Board", icon: KeyRound, statusKey: null },
];

export default function Documentation() {
  const [docCategory, setDocCategory] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading: loadingCompany } = useQuery({
    queryKey: ["company_profile"],
    queryFn: () => base44.entities.Company.list("-created_date", 1),
    initialData: [],
  });
  const company = companies[0];

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", company?.id],
    queryFn: () => base44.entities.Document.filter({ company_id: company.id }),
    enabled: !!company?.id,
    initialData: [],
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => editDoc
      ? base44.entities.Document.update(editDoc.id, data)
      : base44.entities.Document.create(data),
    onSuccess: async (savedDoc, submittedData) => {
      queryClient.invalidateQueries({ queryKey: ["documents", company?.id] });
      await updateStatuses();

      // Auto-sync phone payment as a Phone expense
      if (submittedData.category === "phone" && submittedData.phone_payment_amount) {
        const amount = parseFloat(submittedData.phone_payment_amount);
        if (amount > 0) {
          const today = new Date().toISOString().split("T")[0];
          const freq = submittedData.phone_payment_frequency || "Monthly";
          const expenseName = submittedData.provider ? `Phone – ${submittedData.provider}` : "Phone Bill";
          const expenseData = {
            date: today,
            expense_name: expenseName,
            category: "Phone",
            vendor: submittedData.provider || "",
            amount,
            expense_type: freq === "Monthly" ? "Fixed" : "Variable",
            payment_status: "Pending",
            notes: `Auto-synced from Corporate Phone (${freq})`,
            is_recurring: true,
            recurrence_frequency: freq,
          };
          const existing = await base44.entities.Expense.filter({ category: "Phone", expense_name: expenseName });
          if (existing.length > 0) {
            await base44.entities.Expense.update(existing[0].id, expenseData);
          } else {
            await base44.entities.Expense.create(expenseData);
          }
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
      }

      // Auto-sync monthly_payment as a Rent expense
      if (submittedData.category === "lease" && submittedData.monthly_payment) {
        const amount = parseFloat(submittedData.monthly_payment);
        if (amount > 0) {
          const today = new Date().toISOString().split("T")[0];
          const expenseName = submittedData.address ? `Rent – ${submittedData.address}` : "Rent";
          const expenseData = {
            date: submittedData.start_date || today,
            expense_name: expenseName,
            category: "Rent",
            vendor: "",
            amount,
            expense_type: "Fixed",
            payment_status: "Pending",
            notes: "Auto-synced from Business Address Lease",
            is_recurring: true,
            recurrence_frequency: "Monthly",
          };
          // Check if a rent expense already exists linked to this lease (by name match)
          const existing = await base44.entities.Expense.filter({ category: "Rent", expense_name: expenseName });
          if (existing.length > 0) {
            await base44.entities.Expense.update(existing[0].id, expenseData);
          } else {
            await base44.entities.Expense.create(expenseData);
          }
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
      }

      setDocCategory(null);
      setEditDoc(null);
    },
  });

  const updateStatuses = async () => {
    if (!company?.id) return;
    const updatedDocs = await base44.entities.Document.filter({ company_id: company.id });
    const statusUpdates = {};
    CATEGORY_CONFIG.forEach((cat) => {
      if (!cat.statusKey) return;
      const catDocs = updatedDocs.filter((d) => d.category === cat.key);
      if (catDocs.length === 0) {
        statusUpdates[cat.statusKey] = "pending";
      } else if (cat.key === "lease") {
        const isComplete = catDocs.some((d) =>
          (d.lease_type === "Virtual Office" && d.login_username && d.login_password) ||
          d.file_url
        );
        statusUpdates[cat.statusKey] = isComplete ? "complete" : "in_progress";
      } else if (cat.key === "email_account" || cat.key === "alibaba_account") {
        const isComplete = catDocs.some((d) => d.email && d.password);
        statusUpdates[cat.statusKey] = isComplete ? "complete" : "in_progress";
      } else if (cat.key === "gs1_account") {
        const isComplete = catDocs.some((d) => d.gs1_username && d.gs1_password);
        statusUpdates[cat.statusKey] = isComplete ? "complete" : "in_progress";
      } else {
        statusUpdates[cat.statusKey] = catDocs.some((d) => d.file_url) ? "complete" : "in_progress";
      }
    });
    await base44.entities.Company.update(company.id, statusUpdates);
    queryClient.invalidateQueries({ queryKey: ["company_profile"] });
  };

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Documentation</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {company ? `${company.brand_name || company.company_name} · All corporate documents` : "Set up a company profile first."}
        </p>
      </div>

      {!company ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No company profile found.</p>
          <p className="text-sm mt-1">Please set up your Company Profile first.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORY_CONFIG.map((cat) => (
            <DocumentCategoryCard
              key={cat.key}
              title={cat.label}
              icon={cat.icon}
              status={cat.statusKey ? (company[cat.statusKey] || "pending") : null}
              category={cat.key}
              documents={documents.filter((d) => d.category === cat.key)}
              onAdd={() => { setEditDoc(null); setDocCategory(cat.key); }}
              onEdit={(doc) => { setEditDoc(doc); setDocCategory(doc.category); }}
            />
          ))}
        </div>
      )}

      {docCategory && company && (
        <DocumentFormDialog
          open={!!docCategory}
          onClose={() => { setDocCategory(null); setEditDoc(null); }}
          category={docCategory}
          companyId={company.id}
          onSave={(data) => createDocMutation.mutateAsync(data)}
          editDoc={editDoc}
        />
      )}
    </div>
  );
}