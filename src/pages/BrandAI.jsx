import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, Trash2, Loader2, ChevronRight } from "lucide-react";
import ChatMessage from "@/components/brandai/ChatMessage";
import QuickActionButtons from "@/components/brandai/QuickActionButtons";
import SuggestedPrompts from "@/components/brandai/SuggestedPrompts";

const WELCOME = {
  role: "assistant",
  content: `# Welcome to your Brand AI Assistant 👋

I'm here to help you grow your brand with intelligent recommendations. I have access to your:

- **Brand strategy** & positioning
- **Products** & pricing data
- **Inventory** levels
- **Sales** performance
- **Customer** data

**What would you like to do today?** Use the quick action buttons on the left or type a question below.`,
};

function buildBrandContext({ brand, brandGuidelines, products, inventory, orders, customers, wholesaleInvoices }) {
  const parts = [];

  if (brand) {
    parts.push(`BRAND OVERVIEW:
- Brand Name: ${brand.brand_name || "N/A"}
- Tagline: ${brand.tagline || "N/A"}
- Mission: ${brand.mission_statement || "N/A"}
- Vision: ${brand.vision || "N/A"}
- Core Values: ${brand.core_values || "N/A"}
- Brand Story: ${brand.brand_story || "N/A"}`);
  }

  if (brandGuidelines) {
    parts.push(`BRAND GUIDELINES:
- Brand Voice: ${brandGuidelines.brand_voice || "N/A"}
- Visual Style: ${brandGuidelines.visual_style || "N/A"}
- Typography Heading: ${brandGuidelines.typography_heading || "N/A"}
- Dos: ${brandGuidelines.dos || "N/A"}
- Don'ts: ${brandGuidelines.donts || "N/A"}`);
  }

  if (products?.length > 0) {
    parts.push(`PRODUCTS (${products.length} total):
${products.slice(0, 10).map((p) =>
  `- ${p.product_name || p.name}: ${p.retail_price ? `$${p.retail_price}` : ""} ${p.category ? `[${p.category}]` : ""}`
).join("\n")}`);
  }

  if (inventory?.length > 0) {
    const lowStock = inventory.filter((i) => i.current_stock <= i.min_stock_level && i.min_stock_level > 0);
    parts.push(`INVENTORY (${inventory.length} items):
- Total SKUs: ${inventory.length}
- Low Stock Items: ${lowStock.length}
- Total Inventory Value: $${inventory.reduce((s, i) => s + (i.current_stock || 0) * (i.unit_cost || 0), 0).toFixed(2)}
${lowStock.length > 0 ? `- Low Stock: ${lowStock.map((i) => i.product_name).join(", ")}` : ""}`);
  }

  if (orders?.length > 0) {
    const paid = orders.filter((o) => o.payment_status === "Paid");
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    parts.push(`SALES PERFORMANCE (${orders.length} orders):
- Paid Orders: ${paid.length}
- Total Revenue: $${revenue.toFixed(2)}
- Pending Orders: ${orders.filter((o) => o.order_status === "Pending").length}
- Completed Orders: ${orders.filter((o) => o.order_status === "Completed").length}`);
  }

  if (wholesaleInvoices?.length > 0) {
    const paidInv = wholesaleInvoices.filter((i) => i.status === "Paid");
    const totalRev = paidInv.reduce((s, i) => s + (i.total || 0), 0);
    parts.push(`WHOLESALE INVOICES (${wholesaleInvoices.length} total):
- Paid: ${paidInv.length} — Revenue: $${totalRev.toFixed(2)}
- Pending: ${wholesaleInvoices.filter((i) => ["Draft", "Sent"].includes(i.status)).length}
- Customer Types: ${[...new Set(wholesaleInvoices.map((i) => i.customer_type))].join(", ")}`);
  }

  if (customers?.length > 0) {
    parts.push(`CUSTOMERS (${customers.length} total):
- Types: ${[...new Set(customers.map((c) => c.customer_type))].join(", ")}
- Countries: ${[...new Set(customers.map((c) => c.country).filter(Boolean))].slice(0, 5).join(", ")}`);
  }

  return parts.join("\n\n");
}

export default function BrandAI() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Fetch all brand context data in parallel
  const { data: brandItems = [] } = useQuery({ queryKey: ["brand_overviews"], queryFn: () => base44.entities.BrandOverview.list(), initialData: [] });
  const { data: guidelineItems = [] } = useQuery({ queryKey: ["brand_guidelines"], queryFn: () => base44.entities.BrandGuideline.list(), initialData: [] });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list(), initialData: [] });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => base44.entities.Inventory.list(), initialData: [] });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list("-order_date", 100), initialData: [] });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => base44.entities.Customer.list(), initialData: [] });
  const { data: wholesaleInvoices = [] } = useQuery({ queryKey: ["wholesale_invoices"], queryFn: () => base44.entities.WholesaleInvoice.list(), initialData: [] });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const brandContext = buildBrandContext({
    brand: brandItems[0],
    brandGuidelines: guidelineItems[0],
    products,
    inventory,
    orders,
    customers,
    wholesaleInvoices,
  });

  const sendMessage = async (text, label) => {
    const userMsg = label || text;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    const systemPrompt = `You are a Brand AI Assistant — an expert in brand strategy, marketing, product development, and e-commerce growth.

You have been given real data from the user's brand management system. Use this data to provide specific, actionable, and intelligent recommendations.

BRAND CONTEXT DATA:
${brandContext || "No brand data available yet. Provide general advice."}

INSTRUCTIONS:
- Always reference specific brand data when available
- Be specific and actionable, not generic
- Use markdown formatting for clarity (headers, bullets, bold)
- Keep responses focused and practical
- If suggesting content, actually write the content (captions, emails, etc.)
- For analysis, provide clear numbers and recommendations`;

    const fullPrompt = `${systemPrompt}\n\nUser Request: ${text}`;
    const aiResponse = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });

    setMessages((prev) => [...prev, { role: "assistant", content: aiResponse, label }]);
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar: Quick Actions */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4 hidden lg:block">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Brand AI</p>
            <p className="text-[10px] text-slate-400">Powered by AI</p>
          </div>
        </div>

        {/* Brand context status */}
        <div className="mb-4 p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Context Loaded</p>
          {[
            { label: "Brand Strategy", active: !!brandItems[0] },
            { label: "Products", active: products.length > 0, count: products.length },
            { label: "Inventory", active: inventory.length > 0, count: inventory.length },
            { label: "Orders", active: orders.length > 0, count: orders.length },
            { label: "Customers", active: customers.length > 0, count: customers.length },
            { label: "Wholesale Invoices", active: wholesaleInvoices.length > 0, count: wholesaleInvoices.length },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className={item.active ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {item.active ? (item.count !== undefined ? item.count : "✓") : "—"}
              </span>
            </div>
          ))}
        </div>

        <QuickActionButtons onAction={sendMessage} loading={loading} />

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 text-slate-400 hover:text-red-500 gap-1.5 text-xs"
          onClick={() => setMessages([WELCOME])}
        >
          <Trash2 className="h-3 w-3" /> Clear Chat
        </Button>
      </aside>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">Brand AI Assistant</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium ml-1">AI-Powered</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Ask anything about your brand, get intelligent recommendations powered by your data.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (shown when only welcome message) */}
        {messages.length === 1 && (
          <div className="px-4 lg:px-6 pb-3">
            <SuggestedPrompts onSelect={(p) => sendMessage(p)} loading={loading} />
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your brand, request content, or get strategic advice..."
              className="resize-none min-h-[44px] max-h-32 flex-1 text-sm"
              rows={1}
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 h-11 w-11 p-0 flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}