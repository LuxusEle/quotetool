'use client';

import React, { useRef } from 'react';
import { ProjectDetails, Cabinet, Wall, CalculatedPricing, DesignOptions } from '@/types/kitchen';
import { Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FabricationSheetProps {
  project: ProjectDetails;
  cabinets: Cabinet[];
  walls: Wall[];
  pricing: CalculatedPricing;
  options: DesignOptions;
  isOwnerRole: boolean;
}

export const FabricationSheet: React.FC<FabricationSheetProps> = ({
  project,
  cabinets,
  walls,
  pricing,
  options,
  isOwnerRole,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    try {
      const element = sheetRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${project.refNumber}_Fabrication_Work_Order.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Workshop Fabrication Work Order</h3>
          <p className="text-xs text-slate-400">Technical cut-sheet & cabinet specifications for production team</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" /> Download Fabrication Sheet
          </button>
          <button
            onClick={() => window.print()}
            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-center overflow-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800">
        <div
          ref={sheetRef}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-10 shadow-2xl font-mono text-xs flex flex-col justify-between"
        >
          <div>
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  LUXUS WORKSHOP FABRICATION ORDER
                </h1>
                <p className="text-slate-600">Aluminium Frame & Carcass Fabrication Schedule</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm bg-slate-900 text-white px-2 py-0.5">
                  REF: {project.refNumber}
                </span>
                <p className="text-slate-500 mt-1">Client: {project.customerName}</p>
                <p className="text-slate-500">Site: {project.location}</p>
              </div>
            </div>

            {/* Room Parameters */}
            <div className="my-4 p-3 bg-slate-100 border border-slate-300 rounded grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 block">Shape:</span>
                <span className="font-bold uppercase">{options.shape}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Room Height:</span>
                <span className="font-bold">{project.wallHeight} mm</span>
              </div>
              <div>
                <span className="text-slate-500 block">Finish:</span>
                <span className="font-bold">{options.finish}</span>
              </div>
            </div>

            {/* Walls & Openings */}
            <div className="mb-4">
              <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                1. Wall Dimensions & Openings
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {walls.map((w) => (
                  <div key={w.id} className="p-2 border border-slate-200 bg-slate-50 rounded">
                    <p className="font-bold">Wall {w.id}: {w.length} mm</p>
                    <p className="text-[10px] text-slate-600">
                      Openings: {w.openings.length === 0 ? 'None' : w.openings.map((o) => `${o.type} (${o.width}x${o.height})`).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exact Placed Cabinets Fabrication Schedule */}
            <div className="mb-4">
              <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                2. Placed Cabinet Cut-List & Module Schedule ({cabinets.length} total units)
              </h4>
              <table className="w-full border-collapse text-left border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="p-1.5 border border-slate-300">Wall</th>
                    <th className="p-1.5 border border-slate-300">Pos (mm)</th>
                    <th className="p-1.5 border border-slate-300">Unit Type</th>
                    <th className="p-1.5 border border-slate-300">Dimensions (W×D×H)</th>
                    <th className="p-1.5 border border-slate-300">Charge LF</th>
                    <th className="p-1.5 border border-slate-300">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {cabinets.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border border-slate-300 font-bold">Wall {c.wallId}</td>
                      <td className="p-1.5 border border-slate-300">{c.startMm} mm</td>
                      <td className="p-1.5 border border-slate-300 font-semibold">{c.label}</td>
                      <td className="p-1.5 border border-slate-300">
                        {c.widthMm} × {c.depthMm} × {c.heightMm} mm
                      </td>
                      <td className="p-1.5 border border-slate-300 font-bold">
                        {(c.chargeWidthMm / 304.8).toFixed(2)} LF
                      </td>
                      <td className="p-1.5 border border-slate-300 text-[10px] text-slate-600">
                        {c.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Linear Quantities Summary */}
            <div className="my-4 p-3 bg-slate-100 border border-slate-300 rounded grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-slate-500 block">Total Base:</span>
                <span className="font-bold text-sm">{pricing.baseLF} LF</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Wall/Top:</span>
                <span className="font-bold text-sm">{pricing.topLF} LF</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Tall:</span>
                <span className="font-bold text-sm">{pricing.tallLF} LF</span>
              </div>
              <div>
                <span className="text-slate-500 block">Granite Area:</span>
                <span className="font-bold text-sm">{pricing.graniteSqFt} sq ft</span>
              </div>
            </div>

            {/* Optional Owner Workshop Cost for Fabricator Settlement */}
            {isOwnerRole && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded mt-4">
                <span className="text-amber-800 font-bold block uppercase text-[10px]">
                  [Confidential] Approved Fabricator Settlement Amount
                </span>
                <p className="text-lg font-bold text-amber-950">
                  LKR {pricing.fabricatorCost.totalCost.toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-800">
                  Base ({pricing.baseLF} LF @ 15,500) + Top ({pricing.topLF} LF @ 15,500) + Tall ({pricing.tallLF} LF @ 15,500)
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-300 pt-4 flex justify-between text-slate-500 text-[10px]">
            <span>Verified for Factory Fabrication</span>
            <span>Production Supervisor Sign-off: ____________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
