import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart, Users, Store, FileText, Trash2, Pencil, Globe, AlertTriangle, Download, ChevronDown, CheckCircle, PiggyBank } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import SalesStatsBar from "../components/sales/SalesStatsBar";
import SalesCharts from "../components/sales/SalesCharts";
import ProfitabilityPanel from "../components/sales/ProfitabilityPanel";
import OrdersTable from "../components/sales/OrdersTable";
import OrderFormDialog from "../components/sales/OrderFormDialog";
import CustomerFormDialog from "../components/sales/CustomerFormDialog";
import SalesChannelFormDialog from "../components/sales/SalesChannelFormDialog";
import InvoiceFormDialog from "../components/sales/InvoiceFormDialog";
import InvoicePDFDialog from "../components/sales/InvoicePDFDialog";
import CustomerPDFDialog from "../components/sales/CustomerPDFDialog";
import PaymentConfirmDialog from "../components/sales/PaymentConfirmDialog";
import PaymentReceiptDialog from "../components/sales/PaymentReceiptDialog";
import BudgetPanel from "../components/sales/BudgetPanel";
import OrderItemsDialog from "../components/sales/OrderItemsDialog";

const PAYMENT_STATUS_COLORS = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Overdue: "bg-red-100 text-red-700",
  Refunded: "bg-slate-100 text-slate-600",
};

const CUSTOMER_TYPE_COLORS = {
  Retail: "bg-blue-100 text-blue-700",
  Wholesale: "bg-purple-100 text-purple-700",
  Distributor: "bg-orange-100 text-orange-700",
};

export default function SalesDashboard() {
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState("overview");
  const [orderDialog, setOrderDialog] = useState({ open: false, order: null });
  const [customerDialog, setCustomerDialog] = useState({ open: false, customer: null });
  const [channelDialog, setChannelDialog] = useState({ open: false, channel: null });
  const [invoiceDialog, setInvoiceDialog] = useState({ open: false, invoice: null });
  const [invoicePDFDialog, setInvoicePDFDialog] = useState({ open: false, invoice: null });
  const [customerPDFDialog, setCustomerPDFDialog] = useState({ open: false, customer: null });
  const [paymentConfirmDialog, setPaymentConfirmDialog] = useState({ open: false, invoice: null });
  const [paymentReceiptDialog, setPaymentReceiptDialog] = useState({ open: false, invoice: null });
  const [orderItemsDialog, setOrderItemsDialog] = useState({ open: false, order: null });
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list("-order_date") });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => base44.entities.Customer.list() });
  const { data: channels = [] } = useQuery({ queryKey: ["sales_channels"], queryFn: () => base44.entities.SalesChannel.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => base44.entities.Invoice.list("-invoice_date") });
  const { data: orderItems = [] } = useQuery({ queryKey: ["order_items"], queryFn: () => base44.entities.OrderItem.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => base44.entities.Inventory.list() });

  // Orders CRUD
   const saveOrderMutation = useMutation({
     mutationFn: async ({ form, items, existing }) => {
       let orderId;
       if (existing) {
         // Release reservations for old items
         const oldItems = await base44.entities.OrderItem.filter({ order_id: existing.id });
         await Promise.all(oldItems.map(async (oldItem) => {
           const inv = inventory.find(i => i.product_id === oldItem.product_id || i.product_name === oldItem.product_name);
           if (inv) {
             const newReserved = Math.max(0, (inv.reserved || 0) - (oldItem.quantity || 0));
             const onHand = inv.on_hand ?? inv.current_stock ?? 0;
             const newAvailable = onHand - newReserved;
             await base44.entities.Inventory.update(inv.id, { reserved: newReserved, available: newAvailable });
           }
         }));
         await base44.entities.Order.update(existing.id, form);
         orderId = existing.id;
       } else {
         const created = await base44.entities.Order.create(form);
         orderId = created.id;
       }
       // Save order items and reserve stock
       const existingItems = await base44.entities.OrderItem.filter({ order_id: orderId });
       await Promise.all(existingItems.map(i => base44.entities.OrderItem.delete(i.id)));

       await Promise.all(items.filter(i => i.product_name || i.quantity).map(async (i) => {
         await base44.entities.OrderItem.create({ ...i, order_id: orderId });
         // Reserve stock immediately
         const inv = inventory.find(inv => inv.product_id === i.product_id || inv.product_name === i.product_name);
         if (inv) {
           const newReserved = (inv.reserved || 0) + (i.quantity || 0);
           const onHand = inv.on_hand ?? inv.current_stock ?? 0;
           const newAvailable = Math.max(0, onHand - newReserved);
           await base44.entities.Inventory.update(inv.id, { 
             reserved: newReserved, 
             available: newAvailable,
             last_updated: new Date().toISOString().split("T")[0]
           });
         }
       }));
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["orders"] });
       queryClient.invalidateQueries({ queryKey: ["order_items"] });
       queryClient.invalidateQueries({ queryKey: ["inventory"] });
     }
   });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id) => {
      const items = await base44.entities.OrderItem.filter({ order_id: id });
      // Release reservations
      await Promise.all(items.map(async (item) => {
        const inv = inventory.find(i => i.product_id === item.product_id || i.product_name === item.product_name);
        if (inv) {
          const newReserved = Math.max(0, (inv.reserved || 0) - (item.quantity || 0));
          const onHand = inv.on_hand ?? inv.current_stock ?? 0;
          const newAvailable = Math.max(0, onHand - newReserved);
          await base44.entities.Inventory.update(inv.id, { 
            reserved: newReserved, 
            available: newAvailable,
            last_updated: new Date().toISOString().split("T")[0]
          });
        }
      }));
      await base44.entities.Order.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });

  // Customers CRUD
  const saveCustomerMutation = useMutation({
    mutationFn: ({ form, existing }) => existing
      ? base44.entities.Customer.update(existing.id, form)
      : base44.entities.Customer.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Channels CRUD
  const saveChannelMutation = useMutation({
    mutationFn: ({ form, existing }) => existing
      ? base44.entities.SalesChannel.update(existing.id, form)
      : base44.entities.SalesChannel.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales_channels"] }),
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id) => base44.entities.SalesChannel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales_channels"] }),
  });

  // Invoices CRUD
  const saveInvoiceMutation = useMutation({
    mutationFn: ({ form, existing }) => existing?.id
      ? base44.entities.Invoice.update(existing.id, form)
      : base44.entities.Invoice.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status, paymentData, invoice }) => {
      const updatePayload = { payment_status: status, ...(paymentData || {}) };
      await base44.entities.Invoice.update(id, updatePayload);
      
      // Find the order associated with this invoice
      let orderId = invoice?.order_id;
      if (!orderId && invoice?.order_number) {
        const relatedOrder = orders.find(o => o.order_number === invoice.order_number);
        orderId = relatedOrder?.id;
      }
      
      // Sync order payment_status with invoice and calculate fulfillment deadline
      if (orderId) {
        const updateObj = { payment_status: status };
        
        if (status === "Paid") {
          const paymentDateForDeadline = paymentData?.payment_date || new Date().toISOString().split("T")[0];
          const deadlineDate = new Date(paymentDateForDeadline);
          deadlineDate.setDate(deadlineDate.getDate() + 3);
          updateObj.payment_date = paymentDateForDeadline;
          updateObj.fulfillment_deadline = deadlineDate.toISOString().split("T")[0];
        }
        
        await base44.entities.Order.update(orderId, updateObj);
      }
      
      if (status === "Paid") {
        await base44.functions.invoke("fulfillOrderOnInvoicePaid", { invoice_id: id });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_movements"] });
      // After marking as paid, open the receipt
      if (variables.status === "Paid" && variables.invoice) {
        const updatedInvoice = { ...variables.invoice, payment_status: "Paid", ...(variables.paymentData || {}) };
        setPaymentReceiptDialog({ open: true, invoice: updatedInvoice });
      }
    },
  });

  const handleStatusChange = (inv, newStatus) => {
    if (newStatus === "Paid") {
      setPaymentConfirmDialog({ open: true, invoice: inv });
    } else {
      updateInvoiceStatusMutation.mutate({ id: inv.id, status: newStatus, invoice: inv });
    }
  };

  const handlePaymentConfirm = async (paymentData) => {
    const inv = paymentConfirmDialog.invoice;
    await updateInvoiceStatusMutation.mutateAsync({ id: inv.id, status: "Paid", paymentData, invoice: inv });
  };

  const updateOrderFulfillmentMutation = useMutation({
    mutationFn: async ({ id, fulfillmentStatus, fulfillmentDate }) => {
      await base44.entities.Order.update(id, { 
        fulfillment_status: fulfillmentStatus,
        ...(fulfillmentDate ? { fulfillment_date: fulfillmentDate } : {})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Alerts
  const overdueInvoices = invoices.filter(i => i.payment_status === "Overdue" || i.payment_status === "Pending");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & Distribution</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track orders, revenue, customers, and channels</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOrderDialog({ open: true, order: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        )}
      </div>

      {/* Alerts */}
      {overdueInvoices.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{overdueInvoices.length} invoice(s)</span> have pending or overdue payments.
          </p>
          <Button variant="ghost" size="sm" className="ml-auto text-yellow-700 hover:text-yellow-900" onClick={() => setTab("invoices")}>View</Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" className="gap-1.5" data-viewer-allow><ShoppingCart className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5" data-viewer-allow><FileText className="h-3.5 w-3.5" />Orders</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5" data-viewer-allow><Users className="h-3.5 w-3.5" />Customers</TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5" data-viewer-allow><Store className="h-3.5 w-3.5" />Channels</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5" data-viewer-allow><FileText className="h-3.5 w-3.5" />Invoices</TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5" data-viewer-allow><PiggyBank className="h-3.5 w-3.5" />Budget</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <SalesStatsBar orders={orders} orderItems={orderItems} products={products} />
          <SalesCharts orders={orders} orderItems={orderItems} products={products} />
          <ProfitabilityPanel orders={orders} orderItems={orderItems} products={products} inventory={inventory} />
        </TabsContent>

        {/* ORDERS */}
         <TabsContent value="orders" className="mt-4">
           <Card className="border border-slate-200">
             <CardHeader className="flex flex-row items-center justify-between pb-3">
               <CardTitle className="text-sm font-semibold text-slate-700">All Orders ({orders.length})</CardTitle>
               {isAdmin && (
                 <Button size="sm" onClick={() => setOrderDialog({ open: true, order: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                   <Plus className="h-3.5 w-3.5" /> New Order
                 </Button>
               )}
             </CardHeader>
             <CardContent>
               <OrdersTable
                 orders={orders}
                 onEdit={isAdmin ? (o) => setOrderDialog({ open: true, order: o }) : null}
                 onDelete={isAdmin ? (id) => deleteOrderMutation.mutate(id) : null}
                 onCreateInvoice={isAdmin ? (order) => setInvoiceDialog({ open: true, invoice: { order_id: order.id, order_number: order.order_number, customer_name: order.customer_name, subtotal: order.subtotal || 0, tax: order.tax || 0, total_amount: order.total || ((order.subtotal || 0) + (order.tax || 0)) } }) : null}
                 onUpdateFulfillment={isAdmin ? (orderId, status, date) => updateOrderFulfillmentMutation.mutate({ id: orderId, fulfillmentStatus: status, fulfillmentDate: date }) : null}
                 onViewItems={(o) => setOrderItemsDialog({ open: true, order: o })}
                 />
             </CardContent>
           </Card>
         </TabsContent>

        {/* CUSTOMERS */}
        <TabsContent value="customers" className="mt-4">
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Customers ({customers.length})</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setCustomerDialog({ open: true, customer: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Customer
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No customers yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(c => (
                    <Card key={c.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-800">{c.customer_name}</p>
                            {c.company_name && <p className="text-xs text-slate-400">{c.company_name}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={() => setCustomerPDFDialog({ open: true, customer: c })}><Download className="h-3 w-3 text-slate-400" /></Button>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomerDialog({ open: true, customer: c })}><Pencil className="h-3 w-3 text-slate-400" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCustomerMutation.mutate(c.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          <Badge className={`${CUSTOMER_TYPE_COLORS[c.customer_type] || ""} border-0 text-xs`}>{c.customer_type}</Badge>
                          {c.tax_exempt && <Badge className="bg-green-100 text-green-700 border-0 text-xs">Tax Exempt</Badge>}
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mt-2">
                          {c.email && <p>{c.email}</p>}
                          {c.phone && <p>{c.phone}</p>}
                          {c.country && <p>{c.country}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHANNELS */}
        <TabsContent value="channels" className="mt-4">
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Sales Channels ({channels.length})</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setChannelDialog({ open: true, channel: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Channel
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No channels configured yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map(ch => {
                    const chRevenue = orders.filter(o => o.sales_channel_id === ch.id).reduce((s, o) => s + (o.total || 0), 0);
                    const chOrders = orders.filter(o => o.sales_channel_id === ch.id).length;
                    return (
                      <Card key={ch.id} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-800">{ch.channel_name}</p>
                              <Badge className="bg-slate-100 text-slate-600 border-0 text-xs mt-1">{ch.channel_type}</Badge>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChannelDialog({ open: true, channel: ch })}><Pencil className="h-3 w-3 text-slate-400" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteChannelMutation.mutate(ch.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 rounded-lg p-2">
                            <div><p className="text-xs text-slate-400">Revenue</p><p className="font-bold text-indigo-700">${chRevenue.toFixed(0)}</p></div>
                            <div><p className="text-xs text-slate-400">Orders</p><p className="font-bold text-slate-800">{chOrders}</p></div>
                          </div>
                          {ch.platform && <p className="text-xs text-slate-400 mt-2">Platform: {ch.platform}</p>}
                          {ch.website_link && (
                            <a href={ch.website_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline mt-1">
                              <Globe className="h-3 w-3" /> Visit
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="mt-4">
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Invoices ({invoices.length})</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setInvoiceDialog({ open: true, invoice: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create Invoice
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No invoices yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                       <tr className="border-b border-slate-200 text-left">
                         {["Invoice #","Date","Customer","Order Ref","Total","Status","Payment",""].map(h => (
                           <th key={h} className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                         ))}
                       </tr>
                     </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-3 pr-4 font-medium text-indigo-600">{inv.invoice_number}</td>
                          <td className="py-3 pr-4 text-slate-600">{inv.invoice_date}</td>
                          <td className="py-3 pr-4 text-slate-700">{inv.customer_name}</td>
                          <td className="py-3 pr-4 text-slate-500">{inv.order_number || "—"}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-800">${(inv.total_amount || 0).toFixed(2)}</td>
                          <td className="py-3 pr-4">
                            {isAdmin ? (
                              <Select value={inv.payment_status} onValueChange={v => handleStatusChange(inv, v)}>
                                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{["Paid","Pending","Overdue","Refunded"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[inv.payment_status] || ""}`}>{inv.payment_status}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {inv.payment_link ? (
                              <a href={inv.payment_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs font-semibold">
                                PAY ONLINE
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInvoicePDFDialog({ open: true, invoice: inv })} title="Download Invoice PDF"><Download className="h-3 w-3 text-slate-400" /></Button>
                              {inv.payment_status === "Paid" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPaymentReceiptDialog({ open: true, invoice: inv })} title="View Payment Receipt"><CheckCircle className="h-3 w-3 text-green-500" /></Button>
                              )}
                              {isAdmin && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInvoiceDialog({ open: true, invoice: inv })}><Pencil className="h-3 w-3 text-slate-400" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteInvoiceMutation.mutate(inv.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* BUDGET */}
        <TabsContent value="budget" className="mt-4">
          <BudgetPanel orders={orders} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <OrderFormDialog
        open={orderDialog.open}
        order={orderDialog.order}
        onClose={() => setOrderDialog({ open: false, order: null })}
        onSave={(form, items) => saveOrderMutation.mutateAsync({ form, items, existing: orderDialog.order })}
      />
      <CustomerFormDialog
        open={customerDialog.open}
        customer={customerDialog.customer}
        onClose={() => setCustomerDialog({ open: false, customer: null })}
        onSave={(form) => saveCustomerMutation.mutateAsync({ form, existing: customerDialog.customer })}
      />
      <SalesChannelFormDialog
        open={channelDialog.open}
        channel={channelDialog.channel}
        onClose={() => setChannelDialog({ open: false, channel: null })}
        onSave={(form) => saveChannelMutation.mutateAsync({ form, existing: channelDialog.channel })}
      />
      <InvoiceFormDialog
        open={invoiceDialog.open}
        invoice={invoiceDialog.invoice}
        onClose={() => setInvoiceDialog({ open: false, invoice: null })}
        onSave={(form) => saveInvoiceMutation.mutateAsync({ form, existing: invoiceDialog.invoice })}
      />
      <InvoicePDFDialog
        open={invoicePDFDialog.open}
        invoice={invoicePDFDialog.invoice}
        onClose={() => setInvoicePDFDialog({ open: false, invoice: null })}
      />
      <CustomerPDFDialog
        open={customerPDFDialog.open}
        customer={customerPDFDialog.customer}
        onClose={() => setCustomerPDFDialog({ open: false, customer: null })}
      />
      <PaymentConfirmDialog
        open={paymentConfirmDialog.open}
        invoice={paymentConfirmDialog.invoice}
        onClose={() => setPaymentConfirmDialog({ open: false, invoice: null })}
        onConfirm={handlePaymentConfirm}
      />
      <PaymentReceiptDialog
        open={paymentReceiptDialog.open}
        invoice={paymentReceiptDialog.invoice}
        onClose={() => setPaymentReceiptDialog({ open: false, invoice: null })}
      />
      <OrderItemsDialog
        open={orderItemsDialog.open}
        order={orderItemsDialog.order}
        orderItems={orderItems}
        onClose={() => setOrderItemsDialog({ open: false, order: null })}
      />
    </div>
  );
}