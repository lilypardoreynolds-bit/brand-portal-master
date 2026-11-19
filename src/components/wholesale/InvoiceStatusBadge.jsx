import React from "react";

const styles = {
  Draft: "bg-slate-100 text-slate-600",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

export default function InvoiceStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
}