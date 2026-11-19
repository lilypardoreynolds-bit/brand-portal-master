import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, FolderOpen, Trash2, Pencil, TrendingUp, ShieldCheck, Edit3, Link as LinkIcon, Download, PackagePlus } from "lucide-react";
import { calcChannels } from "./pricingCalc";
import { exportScenarioPDF } from "./exportScenarioPDF";
import { cn } from "@/lib/utils";

export default function ScenarioPanel({ scenarios, onSave, onLoad, onDelete, currentForm, onCreateProduct }) {
  const [saveDialog, setSaveDialog] = useState(false);
  const [editScenario, setEditScenario] = useState(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");
  const [fullEditDialog, setFullEditDialog] = useState(false);
  const [fullEditForm, setFullEditForm] = useState(null);

  const openSave = () => {
    setScenarioName("");
    setScenarioNotes("");
    setEditScenario(null);
    setSaveDialog(true);
  };

  const openEdit = (s) => {
    setEditScenario(s);
    setScenarioName(s.name);
    setScenarioNotes(s.notes || "");
    setSaveDialog(true);
  };

  const openFullEdit = (s) => {
    setFullEditForm({ ...s });
    setFullEditDialog(true);
  };

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    if (editScenario) {
      onSave({ ...editScenario, name: scenarioName, notes: scenarioNotes }, true);
    } else {
      onSave({ ...currentForm, name: scenarioName, notes: scenarioNotes }, false);
    }
    setSaveDialog(false);
  };

  const handleFullEditSave = () => {
    const { id, created_date, updated_date, created_by, ...fields } = fullEditForm;
    onSave({ id, ...fields }, true);
    setFullEditDialog(false);
  };

  const setEditField = (field, value) => {
    setFullEditForm(f => ({ ...f, [field]: value }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Saved Scenarios</h3>
        <Button size="sm" onClick={openSave} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 text-xs h-8">
          <Save className="h-3.5 w-3.5" /> Save Current
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
          No scenarios saved yet. Configure your inputs and save.
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {scenarios.map((s) => {
            const channels = calcChannels(s);
            const maxProfit = Math.max(...channels.map(c => c.profit));
            const maxMargin = Math.max(...channels.map(c => c.margin));
            const bestChannel = channels.find(c => c.profit === maxProfit && c.profit > 0);
            const safestChannel = channels.find(c => c.margin === maxMargin && c.margin > 0);

            return (
              <Card key={s.id} className="border-slate-200 hover:border-indigo-300 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      {s.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{s.notes}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                          Retail ${(s.retail_price || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                          Landed ${((s.product_cost || 0) + (s.import_cost || 0) + (s.shipping_cost || 0) + (s.import_extra_costs || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bestChannel && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 text-[10px] px-1.5 py-0">
                            <TrendingUp className="h-2.5 w-2.5" /> {bestChannel.label}: ${bestChannel.profit.toFixed(2)}
                          </Badge>
                        )}
                        {safestChannel && safestChannel.key !== bestChannel?.key && (
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 gap-1 text-[10px] px-1.5 py-0">
                            <ShieldCheck className="h-2.5 w-2.5" /> {safestChannel.label}: {safestChannel.margin.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {(s.amazon_competitor_link || s.alibaba_manufacturer_link) && (
                          <div className="flex gap-1">
                            {s.amazon_competitor_link && (
                              <a href={s.amazon_competitor_link} target="_blank" rel="noopener noreferrer" title="Amazon Competitor" className="inline-flex items-center justify-center h-6 w-6 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                                <LinkIcon className="h-3 w-3" />
                              </a>
                            )}
                            {s.alibaba_manufacturer_link && (
                              <a href={s.alibaba_manufacturer_link} target="_blank" rel="noopener noreferrer" title="Alibaba Manufacturer" className="inline-flex items-center justify-center h-6 w-6 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <LinkIcon className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportScenarioPDF(s)} title="Export PDF">
                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoad(s)} title="Load">
                        <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCreateProduct(s)} title="Create Product from Scenario">
                        <PackagePlus className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openFullEdit(s)} title="Edit">
                        <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)} title="Rename">
                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(`Delete "${s.name}"?`)) onDelete(s.id); }} title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editScenario ? "Rename Scenario" : "Save Scenario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Scenario Name *</Label>
              <Input placeholder="e.g. Holiday Launch — $49.99" value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Optional notes..." value={scenarioNotes} onChange={e => setScenarioNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialog(false)}>Cancel</Button>
            <Button disabled={!scenarioName.trim()} onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editScenario ? "Update" : "Save Scenario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Edit Dialog */}
      <Dialog open={fullEditDialog} onOpenChange={setFullEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scenario — {fullEditForm?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Scenario Name</Label>
              <Input value={fullEditForm?.name || ""} onChange={e => setEditField("name", e.target.value)} />
            </div>
            {/* Importation */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Importation</p>
            </div>
            <div className="space-y-1.5">
              <Label>Product Cost ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.product_cost || 0} onChange={e => setEditField("product_cost", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Shipping Cost ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.shipping_cost || 0} onChange={e => setEditField("shipping_cost", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fees / Duties ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.import_cost || 0} onChange={e => setEditField("import_cost", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Extra Costs — Importation ($) <span className="text-slate-400 font-normal text-[11px]">Labels, Tags, Packaging</span></Label>
              <Input type="number" step="0.01" value={fullEditForm?.import_extra_costs || 0} onChange={e => setEditField("import_extra_costs", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">OPS Extras <span className="text-indigo-400 normal-case font-normal">(Shopify only)</span></p>
            </div>
            <div className="space-y-1.5">
              <Label>OPS Extra Costs ($) <span className="text-slate-400 font-normal text-[11px]">Box, Tape, Flyers</span></Label>
              <Input type="number" step="0.01" value={fullEditForm?.ops_extra_costs || 0} onChange={e => setEditField("ops_extra_costs", parseFloat(e.target.value) || 0)} />
            </div>
            {/* Pricing */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Pricing</p>
            </div>
            <div className="space-y-1.5">
              <Label>Retail Price ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.retail_price || 0} onChange={e => setEditField("retail_price", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Wholesale Price ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.wholesale_price || 0} onChange={e => setEditField("wholesale_price", parseFloat(e.target.value) || 0)} />
            </div>
            {/* Channel Fees */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Channel Fees</p>
            </div>
            <div className="space-y-1.5">
              <Label>Amazon FBA Total Fee ($)</Label>
              <Input type="number" step="0.01" value={fullEditForm?.amazon_fba_fee || 0} onChange={e => setEditField("amazon_fba_fee", parseFloat(e.target.value) || 0)} />
            </div>
            {/* Links */}
            <div className="col-span-2 space-y-1.5 mt-2">
              <Label>Amazon Competitor Link</Label>
              <Input type="url" placeholder="https://amazon.com/dp/..." value={fullEditForm?.amazon_competitor_link || ""} onChange={e => setEditField("amazon_competitor_link", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Alibaba Manufacturer Link</Label>
              <Input type="url" placeholder="https://alibaba.com/..." value={fullEditForm?.alibaba_manufacturer_link || ""} onChange={e => setEditField("alibaba_manufacturer_link", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={fullEditForm?.notes || ""} onChange={e => setEditField("notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFullEditDialog(false)}>Cancel</Button>
            <Button onClick={handleFullEditSave} className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}