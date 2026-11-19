import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import ProductFormDialog from "@/components/product/ProductFormDialog";

export default function ProductsPage() {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState({ open: false, product: null });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-updated_date"),
    initialData: [],
  });

  const saveProduct = useMutation({
    mutationFn: async (form) => {
      if (form.id) {
        const { id, ...rest } = form;
        return base44.entities.Product.update(id, rest);
      }
      return base44.entities.Product.create(form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: id => base44.entities.Product.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const handleDelete = (product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      deleteProduct.mutate(product.id);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = {
    active: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    inactive: "bg-slate-100 text-slate-800"
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setFormDialog({ open: true, product: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-fit">
            <Plus className="h-4 w-4" /> Create Product
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="bg-slate-100 rounded-full p-4 mb-3">
            <Plus className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No products found</p>
          <p className="text-sm text-slate-400 mt-1">Create your first product to get started</p>
          {isAdmin && (
            <Button onClick={() => setFormDialog({ open: true, product: null })} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" /> Create Product
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Retail Price</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Wholesale Price</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 object-cover rounded border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-300 text-xs">No img</div>
                      )}
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.sku || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColor[p.status] || "bg-slate-100 text-slate-800"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.retail_price > 0 ? `$${p.retail_price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.wholesale_price > 0 ? `$${p.wholesale_price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setFormDialog({ open: true, product: p })}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(p)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormDialog
        open={formDialog.open}
        product={formDialog.product}
        onClose={() => setFormDialog({ open: false, product: null })}
        onSave={form => saveProduct.mutateAsync(form)}
      />
    </div>
  );
}