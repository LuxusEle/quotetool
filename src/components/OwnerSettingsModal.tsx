'use client';

import React, { useState } from 'react';
import { PricingSettings } from '@/types/kitchen';
import { Shield, KeyRound, Save, X } from 'lucide-react';

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
            <h3 className="font-bold text-base">Owner Confidential Rates & Settings</h3>
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
              <h4 className="font-bold text-lg text-white">Confidential Area</h4>
              <p className="text-xs text-slate-400 mt-1">
                Enter your Owner PIN to access confidential fabricator rates, margin calculations, and quotation defaults.
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                1. Confidential Fabricator Costs (LKR)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Cabinet Cost / LF</label>
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
                  <label className="text-xs text-slate-400 block mb-1">Top Cabinet Cost / LF</label>
                  <input
                    type="number"
                    value={form.topInternalRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, topInternalRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tall Cabinet Cost / LF</label>
                  <input
                    type="number"
                    value={form.tallInternalRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, tallInternalRatePerLF: Number(e.target.value) })
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
                  <label className="text-xs text-slate-400 block mb-1">Wiring & Plumbing / LF</label>
                  <input
                    type="number"
                    value={form.servicesRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, servicesRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Services Max Cap (LKR)</label>
                  <input
                    type="number"
                    value={form.servicesMaxCap}
                    onChange={(e) =>
                      setForm({ ...form, servicesMaxCap: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Customer Selling Rates */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                2. Client Selling Rates (LKR)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Cabinet Sell / LF</label>
                  <input
                    type="number"
                    value={form.baseSellingRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, baseSellingRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Top Cabinet Sell / LF</label>
                  <input
                    type="number"
                    value={form.topSellingRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, topSellingRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tall Cabinet Sell / LF</label>
                  <input
                    type="number"
                    value={form.tallSellingRatePerLF}
                    onChange={(e) =>
                      setForm({ ...form, tallSellingRatePerLF: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Granite Sell / Sq Ft</label>
                  <input
                    type="number"
                    value={form.graniteSellingRatePerSqFt}
                    onChange={(e) =>
                      setForm({ ...form, graniteSellingRatePerSqFt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Terms & Banking */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                3. Quotation Terms Defaults
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
