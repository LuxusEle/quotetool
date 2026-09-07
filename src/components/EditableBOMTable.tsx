'use client';

import React, { useState } from 'react';
import { BOMItem, ProjectDetails } from '@/types/kitchen';
import { Plus, Trash2, Save, Download, Calculator, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface EditableBOMTableProps {
  project: ProjectDetails;
  initialItems: BOMItem[];
  onSaveBOM: (updatedItems: BOMItem[]) => void;
  onResetBOM: () => void;
}

export const EditableBOMTable: React.FC<EditableBOMTableProps> = ({
  project,
  initialItems,
  onSaveBOM,
  onResetBOM,
}) => {
  const [items, setItems] = useState<BOMItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState<{
    name: string;
    code: string;
    category: BOMItem['category'];
    quantity: number;
    unit: string;
    unitCost: number;
  }>({
    name: '',
    code: 'CUSTOM-01',
    category: 'custom',
    quantity: 1,
    unit: 'pcs',
    unitCost: 5000,
  });

  const handleUpdateItem = (id: string, field: 'quantity' | 'unitCost', value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.totalCost = Math.round(updated.quantity * updated.unitCost);
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const created: BOMItem = {
      id: `bom-cust-${Date.now()}`,
      code: newItem.code || `CUST-${items.length + 1}`,
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: Number(newItem.quantity) || 1,
      unit: newItem.unit || 'pcs',
      unitCost: Number(newItem.unitCost) || 0,
      totalCost: Math.round((Number(newItem.quantity) || 1) * (Number(newItem.unitCost) || 0)),
      isCustom: true,
    };

    const nextList = [...items, created];
    setItems(nextList);
    onSaveBOM(nextList);
    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      code: `CUSTOM-${items.length + 2}`,
      category: 'custom',
      quantity: 1,
      unit: 'pcs',
      unitCost: 5000,
    });
  };

  const handleSave = () => {
    onSaveBOM(items);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((it) => it.category === selectedCategory);

  const grandTotalCost = items.reduce((sum, it) => sum + it.totalCost, 0);

  const handleExportCSV = () => {
    const headers = ['Code', 'Item Description', 'Category', 'Quantity', 'Unit', 'Unit Cost (LKR)', 'Total Cost (LKR)'];
    const rows = items.map((it) => [
      it.code,
      `"${it.name.replace(/"/g, '""')}"`,
      it.category,
      it.quantity,
      it.unit,
      it.unitCost,
      it.totalCost,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${project.refNumber}_Manufacturing_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Manufacturing Bill of Materials (BOM)</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
              Factory Cut-List & Hardware Schedule
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Editable manufacturing material requirements. Adjust quantities, unit costs, or add custom components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" /> Add Custom Item
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={onResetBOM}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700"
            title="Reset to Auto Calculated BOM"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg transition"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saved!' : 'Save BOM'}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
        {[
          { id: 'all', label: 'All Materials' },
          { id: 'profiles', label: 'Aluminium Extrusions & Panels' },
          { id: 'hardware', label: 'Hinges & Runners' },
          { id: 'fittings', label: 'Internal Fittings & Organizers' },
          { id: 'countertop', label: 'Countertop & Slab' },
          { id: 'consumables', label: 'Fasteners & Consumables' },
          { id: 'custom', label: 'Custom User Items' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Material / Hardware Specification</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 w-28">Quantity</th>
              <th className="py-3 px-3">Unit</th>
              <th className="py-3 px-4 w-36">Unit Cost (LKR)</th>
              <th className="py-3 px-4 text-right">Total Cost (LKR)</th>
              <th className="py-3 px-3 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredItems.map((it) => (
              <tr key={it.id} className="hover:bg-slate-800/40 transition">
                <td className="py-2.5 px-4 font-mono text-[11px] text-sky-400 font-semibold">
                  {it.code}
                </td>
                <td className="py-2.5 px-4 font-medium text-slate-100">
                  {it.name}
                  {it.isCustom && (
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                      Custom
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className="capitalize text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                    {it.category}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={it.quantity}
                    onChange={(e) => handleUpdateItem(it.id, 'quantity', Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-amber-300 font-mono font-semibold"
                  />
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                  {it.unit}
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={it.unitCost}
                    onChange={(e) => handleUpdateItem(it.id, 'unitCost', Number(e.target.value))}
                    className="w-32 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right text-slate-200 font-mono"
                  />
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                  LKR {it.totalCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => handleDeleteItem(it.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold">
            <tr>
              <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-slate-300">
                Total Factory Material & Hardware Cost:
              </td>
              <td className="py-3 px-4 text-right font-mono text-base text-amber-400">
                LKR {grandTotalCost.toLocaleString()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Custom Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" /> Add Custom Component to BOM
            </h4>
            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Item Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blum Aventos HF Bi-fold Lift System"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Item Code</label>
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value as BOMItem['category'] })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="fittings">Fittings & Organizers</option>
                    <option value="profiles">Profiles & Panels</option>
                    <option value="countertop">Countertop</option>
                    <option value="consumables">Consumables</option>
                    <option value="custom">Custom Specialty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={newItem.unitCost}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unitCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Calculated Line Total:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  LKR {Math.round(newItem.quantity * newItem.unitCost).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
