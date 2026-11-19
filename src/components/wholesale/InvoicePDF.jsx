import React, { forwardRef } from "react";
import { format } from "date-fns";

const InvoicePDF = forwardRef(({ invoice, items, company }, ref) => {
  const fmt = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d) => { try { return d ? format(new Date(d), "MMMM d, yyyy") : "—"; } catch { return d || "—"; } };

  const subtotal = items.reduce((s, i) => s + (i.line_total || 0), 0);
  const taxAmount = invoice.tax_exempt ? 0 : (invoice.tax_amount || 0);
  const total = invoice.total || subtotal + taxAmount + (invoice.shipping || 0);

  const sellerName = company?.company_name || company?.brand_name || "";
  const sellerAddress = company?.business_address || "";
  const sellerPhone = company?.phone_number || "";
  const sellerWebsite = company?.website || "";
  const sellerEIN = company?.ein || "";

  return (
    <div ref={ref} style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#1a1a1a", background: "white", padding: "40px 48px", minHeight: "100vh" }}>

      {/* Top: Invoice title + logo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "26px", fontWeight: "800", marginBottom: "10px" }}>Invoice</div>
          <div style={{ marginBottom: "3px" }}><strong>Invoice number</strong> &nbsp; {invoice.invoice_number}</div>
          <div style={{ marginBottom: "3px" }}><strong>Date of issue</strong> &nbsp; {fmtDate(invoice.invoice_date)}</div>
          {invoice.due_date && <div><strong>Date due</strong> &nbsp; {fmtDate(invoice.due_date)}</div>}
        </div>
        {company?.logo_url && (
          <img src={company.logo_url} alt="Logo" style={{ height: "60px", objectFit: "contain" }} />
        )}
      </div>

      <div style={{ borderTop: "1px solid #e0e0e0", marginBottom: "24px" }} />

      {/* Three columns: From / Bill To / Ship To */}
      <div style={{ display: "flex", gap: "32px", marginBottom: "32px" }}>
        {/* From (Seller) */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>{sellerName}</div>
          {company?.brand_name && company?.brand_name !== sellerName && <div style={{ color: "#374151" }}>{company.brand_name}</div>}
          {sellerAddress && <div style={{ color: "#374151", lineHeight: "1.6" }}>{sellerAddress}</div>}
          {sellerPhone && <div style={{ color: "#374151" }}>{sellerPhone}</div>}
          {company?.email && <div style={{ color: "#374151" }}>{company.email}</div>}
          {sellerWebsite && <div style={{ color: "#374151" }}>{sellerWebsite}</div>}
          {sellerEIN && <div style={{ color: "#374151" }}>EIN: {sellerEIN}</div>}
        </div>

        {/* Bill To */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Bill to</div>
          <div style={{ color: "#374151", lineHeight: "1.6" }}>
            <div>{invoice.customer_name}</div>
            {invoice.company_name && <div>{invoice.company_name}</div>}
            {invoice.customer_address && <div>{invoice.customer_address}</div>}
            {(invoice.city || invoice.state) && (
              <div>{[invoice.city, invoice.state].filter(Boolean).join("-")}{invoice.zip_code ? ` ${invoice.zip_code}` : ""}</div>
            )}
            {invoice.country && <div>{invoice.country}</div>}
            {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
            {invoice.customer_email && <div>{invoice.customer_email}</div>}
          </div>
        </div>

        {/* Ship To */}
        {invoice.ship_to_name && (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Ship to</div>
            <div style={{ color: "#374151", lineHeight: "1.6" }}>
              <div>{invoice.ship_to_name}</div>
              {invoice.ship_to_address && <div>{invoice.ship_to_address}</div>}
              {(invoice.ship_to_city || invoice.ship_to_state) && (
                <div>{[invoice.ship_to_city, invoice.ship_to_state].filter(Boolean).join(", ")}{invoice.ship_to_zip ? ` ${invoice.ship_to_zip}` : ""}</div>
              )}
              {invoice.ship_to_country && <div>{invoice.ship_to_country}</div>}
              {invoice.ship_to_phone && <div>{invoice.ship_to_phone}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Amount Due Banner */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>
          {fmt(total)} USD{invoice.due_date ? ` due ${fmtDate(invoice.due_date)}` : ""}
        </div>
      </div>

      {/* Seller Info Block */}
      <div style={{ marginBottom: "24px", fontSize: "11px", color: "#374151", lineHeight: "1.7", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 16px" }}>
        <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "6px" }}>Seller Information</div>
        {sellerName && <div><strong>Company:</strong> {sellerName}</div>}
        {company?.brand_name && company?.brand_name !== sellerName && <div><strong>Brand:</strong> {company.brand_name}</div>}
        {sellerAddress && <div><strong>Address:</strong> {sellerAddress}</div>}
        {sellerPhone && <div><strong>Phone:</strong> {sellerPhone}</div>}
        {company?.email && <div><strong>Email:</strong> {company.email}</div>}
        {sellerWebsite && <div><strong>Website:</strong> {sellerWebsite}</div>}
        {sellerEIN && <div><strong>EIN:</strong> {sellerEIN}</div>}
        {company?.registration_number && <div><strong>Registration #:</strong> {company.registration_number}</div>}
        {company?.state_of_registration && <div><strong>State of Registration:</strong> {company.state_of_registration}</div>}
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #c0c0c0" }}>
            <th style={{ padding: "6px 8px 6px 0", textAlign: "left", fontWeight: "600", fontSize: "11px", color: "#555" }}>Description</th>
            <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", fontSize: "11px", color: "#555", width: "50px" }}>Qty</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600", fontSize: "11px", color: "#555", width: "110px" }}>Unit price<br />(excl. tax)</th>
            <th style={{ padding: "6px 0 6px 8px", textAlign: "right", fontWeight: "600", fontSize: "11px", color: "#555", width: "110px" }}>Amount<br />(excl. tax)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #efefef" }}>
              <td style={{ padding: "10px 8px 10px 0", fontWeight: "400" }}>{item.product_name}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(item.unit_price)}</td>
              <td style={{ padding: "10px 0 10px 8px", textAlign: "right" }}>{fmt(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
        <div style={{ width: "220px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "#555" }}>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {(invoice.discount_total > 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#dc2626" }}>
              <span>Discounts</span>
              <span>-{fmt(invoice.discount_total)}</span>
            </div>
          )}
          {!invoice.tax_exempt && taxAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "#555" }}>Tax ({invoice.tax_rate}%)</span>
              <span>{fmt(taxAmount)}</span>
            </div>
          )}
          {invoice.shipping > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "#555" }}>Shipping</span>
              <span>{fmt(invoice.shipping)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #333", marginTop: "4px" }}>
            <span>Total</span>
            <span style={{ fontWeight: "600" }}>{fmt(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #333" }}>
            <span style={{ fontWeight: "700" }}>Amount due</span>
            <span style={{ fontWeight: "800" }}>{fmt(total)} USD</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginBottom: "16px", color: "#374151" }}>
          <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "11px" }}>Notes</div>
          <div>{invoice.notes}</div>
        </div>
      )}

      {/* Legal Footer */}
      {invoice.legal_footer && (
        <div style={{ marginTop: "24px", fontSize: "11px", color: "#374151", lineHeight: "1.7", borderTop: "1px solid #e0e0e0", paddingTop: "16px", whiteSpace: "pre-line" }}>
          {invoice.legal_footer}
        </div>
      )}

      {/* Page footer */}
      <div style={{ marginTop: "40px", borderTop: "1px solid #e0e0e0", paddingTop: "10px", textAlign: "right", color: "#aaa", fontSize: "10px" }}>
        Page 1 of 1
      </div>
    </div>
  );
});

InvoicePDF.displayName = "InvoicePDF";
export default InvoicePDF;