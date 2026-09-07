'use client';

import React, { useState } from 'react';
import { PricingSettings } from '@/types/kitchen';
import { Shield, KeyRound, Save, X, Calculator, HelpCircle } from 'lucide-react';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PricingSettings;
  onSaveSettings: (newSettings: PricingSettings) => void;
  isOwnerUnlocked: boolean;
  onUnlockOwner: (pass: string) => boolean;
}

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  isOwnerUnlocked,
  onUnlockOwner,
}) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [form, setForm] = useState<PricingSettings>(settings);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlockOwner(pin);
    if (!success) {
      setPinError(true);
    } else {
      setPinError(false);
      setPin('');
    }
  };

  const handleSave = () => {
    onSaveSettings(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">Owner Confidential Rates & Pricing Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isOwnerUnlocked ? (
          /* Locked PIN Prompt */
          <form onSubmit={handleUnlock} className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Confidential Owner Area</h4>
              <p className="text-xs text-slate-400 mt-1">
                Enter your Owner PIN to access confidential fabricator rates, higher-price selling formulas, and quotation defaults.
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="password"
                placeholder="Enter PIN (Default: 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-2 text-center text-lg tracking-widest bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 text-white"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400">Incorrect PIN. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
            >
              Unlock Settings
            </button>
          </form>
        ) : (
          /* Unlocked Settings Form */
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
            {/* Section 1: Internal Fabricator Costs */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center justify-between">
                <span>1. Confidential Fabricator Costs (LKR)</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">Internal only</span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cabinet Structure Type</label>
                  <select
                    value={form.cabinetType || 'full_box'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cabinetType: e.target.value as 'full_box' | 'bottom_frame',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="full_box">Full-Box Cabinets (LKR 15,500 / ft)</option>
                    <option value="bottom_frame">Bottom Frame (LKR 13,500 / ft)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Full-Box Cabinet Cost / LF</label>
                  <input
                    type="number"
                    value={form.baseInternalRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, baseInternalRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Bottom Frame Cost / LF</label>
                  <input
                    type="number"
                    value={form.bottomFrameInternalRatePerLF || 13500}
                    onChange={(e) =>
                      setForm({ ...form, bottomFrameInternalRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Granite Worktop / Sq Ft</label>
                  <input
                    type="number"
                    value={form.graniteInternalRatePerSqFt}
                    onChange={(e) =>
                      setForm({ ...form, graniteInternalRatePerSqFt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plumbing + Electrical (Fixed LKR)</label>
                  <input
                    type="number"
                    value={form.servicesFixedCost}
                    onChange={(e) =>
                      setForm({ ...form, servicesFixedCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Transport (Fixed LKR)</label>
                  <input
                    type="number"
                    value={form.transportFixedCost}
                    onChange={(e) =>
                      setForm({ ...form, transportFixedCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Higher-Price Selling Calculation Rules */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  2. Selling-Price Rules (Higher-Price Rule)
                </h4>
                <span className="text-[10px] text-emerald-400/80 font-mono">max(Option A, Option B)</span>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl mb-3 text-xs text-slate-400 space-y-1">
                <p>
                  <span className="font-semibold text-slate-200">Option A:</span> Total Fabricator Cost × Multiplier (e.g. 1.35)
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Option B:</span> Total Fabricator Cost + Fixed Markup (e.g. LKR 200,000)
                </p>
                <p className="text-emerald-400 text-[11px] font-medium pt-1">
                  The system automatically compares Option A vs Option B, selects whichever is higher, and rounds cleanly for the customer quotation.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Option A Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.markupMultiplier || 1.35}
                    onChange={(e) =>
                      setForm({ ...form, markupMultiplier: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Option B Fixed Markup (LKR)</label>
                  <input
                    type="number"
                    step="10000"
                    value={form.fixedMarkupAddition || 200000}
                    onChange={(e) =>
                      setForm({ ...form, fixedMarkupAddition: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Clean Rounding (LKR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={form.roundingIncrement || 5000}
                    onChange={(e) =>
                      setForm({ ...form, roundingIncrement: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Terms & Banking */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                3. Customer Quotation Terms Defaults
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Advance Payment (%)</label>
                  <input
                    type="number"
                    value={form.advancePercent}
                    onChange={(e) => setForm({ ...form, advancePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={form.leadTimeDays}
                    onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Bank Information</label>
                  <textarea
                    rows={3}
                    value={form.bankDetails}
                    onChange={(e) => setForm({ ...form, bankDetails: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg transition"
              >
                <Save className="w-4 h-4" /> Save Pricing Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
