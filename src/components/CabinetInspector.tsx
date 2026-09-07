'use client';

import React from 'react';
import { Cabinet, CabinetType } from '@/types/kitchen';
import { Lock, Unlock, Trash2, X } from 'lucide-react';

interface CabinetInspectorProps {
  cabinet: Cabinet | null;
  onClose: () => void;
  onUpdateCabinet: (updated: Cabinet) => void;
  onDeleteCabinet: (id: string) => void;
}

export const CabinetInspector: React.FC<CabinetInspectorProps> = ({
  cabinet,
  onClose,
  onUpdateCabinet,
  onDeleteCabinet,
}) => {
  if (!cabinet) return null;

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            Cabinet Inspector
          </h4>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Module Label</label>
          <input
            type="text"
            value={cabinet.label}
            onChange={(e) => onUpdateCabinet({ ...cabinet, label: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Type</label>
          <select
            value={cabinet.type}
            onChange={(e) =>
              onUpdateCabinet({
                ...cabinet,
                type: e.target.value as CabinetType,
              })
            }
            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white capitalize"
          >
            <option value="base">Base Unit</option>
            <option value="drawer">Drawer Bank</option>
            <option value="sink">Sink Cabinet</option>
            <option value="cooker">Cooker/Hob</option>
            <option value="top">Wall / Top Unit</option>
            <option value="hood">Hood Unit</option>
            <option value="tall_pantry">Tall Pantry</option>
            <option value="tall_ref_enclosed">Ref Enclosed</option>
            <option value="tall_ref_free">Ref Free</option>
            <option value="filler_base">Base Filler</option>
            <option value="filler_top">Top Filler</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Width (mm)</label>
          <input
            type="number"
            value={cabinet.widthMm}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateCabinet({
                ...cabinet,
                widthMm: val,
                chargeWidthMm: val,
              });
            }}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Position Start (mm)</label>
          <input
            type="number"
            value={cabinet.startMm}
            onChange={(e) =>
              onUpdateCabinet({
                ...cabinet,
                startMm: Number(e.target.value),
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onUpdateCabinet({ ...cabinet, locked: !cabinet.locked })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            cabinet.locked
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {cabinet.locked ? (
            <>
              <Lock className="w-3.5 h-3.5" /> Position Locked
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5" /> Lock Position
            </>
          )}
        </button>

        <button
          onClick={() => onDeleteCabinet(cabinet.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
};
