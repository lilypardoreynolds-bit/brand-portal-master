import { format, getDaysInMonth, startOfMonth, endOfMonth } from "date-fns";

export function calculateCommission(grossSales, commissionRate) {
  return (grossSales * commissionRate) / 100;
}

export function getReportingPeriod(date) {
  return format(new Date(date), "MMMM yyyy");
}

export function getPeriodDates(month, year) {
  const date = new Date(year, month, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getPaymentDueDate(month, year, paymentDay = 10) {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const day = Math.min(paymentDay, daysInMonth);
  return new Date(year, month, day);
}

export function generateInvoiceNumber(period) {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `COMM-${period.replace(/\s+/g, "-").toUpperCase()}-${timestamp}`;
}

export function calculateGrossSalesForPeriod(orders, periodStart, periodEnd) {
  return orders
    .filter((order) => {
      const orderDate = new Date(order.order_date || order.invoice_date);
      return orderDate >= periodStart && orderDate <= periodEnd;
    })
    .reduce((sum, order) => sum + (order.revenue || order.total || 0), 0);
}