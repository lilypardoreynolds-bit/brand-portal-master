// Shared utilities for Tax Compliance system

export const QUARTERS = [
  { key: "Q1", label: "Q1", months: [0, 1, 2], name: "January – March", filingMonth: 3, filingMonthName: "April" },
  { key: "Q2", label: "Q2", months: [3, 4, 5], name: "April – June",    filingMonth: 6, filingMonthName: "July" },
  { key: "Q3", label: "Q3", months: [6, 7, 8], name: "July – September", filingMonth: 9, filingMonthName: "October" },
  { key: "Q4", label: "Q4", months: [9, 10, 11], name: "October – December", filingMonth: 0, filingMonthName: "January" },
];

export function getQuarterForDate(date) {
  const month = new Date(date).getMonth();
  return QUARTERS.find(q => q.months.includes(month));
}

export function getCurrentQuarter() {
  return getQuarterForDate(new Date());
}

export function getFilingDeadline(quarter, year) {
  const q = QUARTERS.find(q => q.key === quarter);
  if (!q) return null;
  // Q4 files in January of next year
  const filingYear = quarter === "Q4" ? year + 1 : year;
  return {
    reminderDate: new Date(filingYear, q.filingMonth, 10),
    deadlineDate: new Date(filingYear, q.filingMonth, 21),
  };
}

export function calcTaxForEntry(entry) {
  if (entry.tax_exempt) return 0;
  return (entry.revenue || 0) * ((entry.tax_rate || 0) / 100);
}

export function aggregateByQuarter(entries, year) {
  return QUARTERS.map(q => {
    const qEntries = entries.filter(e => {
      if (!e.order_date) return false;
      const d = new Date(e.order_date);
      return d.getFullYear() === year && q.months.includes(d.getMonth());
    });

    const totalRevenue = qEntries.reduce((s, e) => s + (e.revenue || 0), 0);
    const exemptSales  = qEntries.filter(e => e.tax_exempt).reduce((s, e) => s + (e.revenue || 0), 0);
    const taxableSales = totalRevenue - exemptSales;
    const taxCollected = qEntries.reduce((s, e) => s + (e.tax_collected || 0), 0);

    return {
      quarter: q.key,
      name: q.name,
      filingMonthName: q.filingMonthName,
      totalRevenue,
      exemptSales,
      taxableSales,
      taxCollected,
      taxDue: taxCollected,
      entries: qEntries,
    };
  });
}

export const fmt = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;