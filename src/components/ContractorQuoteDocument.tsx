'use client';

import React, { useRef } from 'react';
import { ProjectDetails, CalculatedPricing, DesignOptions, Cabinet, Wall, PricingSettings } from '@/types/kitchen';
import { Download, Printer, ShieldCheck, Factory, FileSpreadsheet } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ContractorQuoteProps {
  project: ProjectDetails;
  pricing: CalculatedPricing;
  options: DesignOptions;
  cabinets: Cabinet[];
  walls: Wall[];
  settings: PricingSettings;
}

export const ContractorQuoteDocument: React.FC<ContractorQuoteProps> = ({
  project,
  pricing,
  options,
  cabinets,
  walls,
  settings,
}) => {
  const quoteRef = useRef<HTMLDivElement>(null);

  const formatLKR = (amt: number) => {
    return (
      'LKR ' +
      amt.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handleDownloadPdf = async () => {
    if (!quoteRef.current) return;
    try {
      const element = quoteRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${project.refNumber}_Contractor_Zero_Margin_Quote.pdf`);
    } catch (err) {
      console.error('Failed to generate Contractor PDF', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Contractor Fabrication Quotation (Zero Margin)</h3>
            <p className="text-xs text-amber-300">
              Confidential Factory Settlement & Material Procurement Schedule (0% Markup)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow transition"
          >
            <Download className="w-4 h-4" /> Download Contractor PDF
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            title="Print Quote"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="flex justify-center overflow-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800">
        <div
          ref={quoteRef}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-12 shadow-2xl flex flex-col justify-between font-sans selection:bg-amber-100"
          style={{ boxSizing: 'border-box' }}
        >
          <div>
            {/* Header Block */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-wider text-slate-900">
                  LUXUS <span className="text-amber-600 font-light">FACTORY</span>
                </h1>
                <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                  Aluminium Manufacturing Division • Contractor Work Order
                </p>
                <div className="text-[10px] text-slate-600 mt-1 font-mono">
                  <p>Internal Workshop Settlement • Strict Zero-Margin Policy</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] uppercase tracking-widest rounded mb-1">
                  CONTRACTOR QUOTE
                </span>
                <p className="text-sm font-bold text-slate-900 font-mono">{project.refNumber}-CTR</p>
                <p className="text-xs text-slate-500">Rev: {project.revision}</p>
                <p className="text-xs text-slate-500">
                  Date: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Site & Client Header */}
            <div className="grid grid-cols-2 gap-4 my-5 p-3.5 bg-amber-50/60 border border-amber-200 rounded text-xs">
              <div>
                <span className="text-[9px] font-bold text-amber-800 uppercase block mb-0.5">
                  Project Reference
                </span>
                <p className="font-bold text-slate-900">{project.customerName || 'Standard Client'}</p>
                <p className="text-slate-600 font-mono text-[11px]">{project.mobile || '-'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-amber-800 uppercase block mb-0.5">
                  Fabrication Spec & Finish
                </span>
                <p className="font-semibold text-slate-800">{options.finish}</p>
                <p className="text-slate-600 text-[11px]">
                  Structure: {settings.cabinetType === 'bottom_frame' ? 'Bottom Frame' : 'Full-Box 40×40 Anodized Aluminium'}
                </p>
              </div>
            </div>

            {/* Itemized Pure Factory Cost Breakdown (ZERO MARGIN) */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Contractor Direct Material & Fabrication Cost Breakdown (0% Markup)
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px]">
                    <th className="py-2 px-3">Fabrication Section</th>
                    <th className="py-2 px-3 text-center">Quantity</th>
                    <th className="py-2 px-3 text-right">Internal Rate</th>
                    <th className="py-2 px-3 text-right">Factory Cost (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {/* Base Cabinet Run */}
                  <tr>
                    <td className="py-2 px-3 font-sans">
                      <span className="font-bold block text-slate-900">Base Cabinet Carcass Runs</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        600mm depth full carcass sub-structure
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">{pricing.baseLF} LF</td>
                    <td className="py-2 px-3 text-right">
                      {settings.cabinetType === 'bottom_frame' ? '13,500' : '15,500'} / LF
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {pricing.fabricatorCost.baseCost.toLocaleString()}
                    </td>
                  </tr>

                  {/* Top Cabinet Run */}
                  {options.topCabinets && (
                    <tr>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold block text-slate-900">Upper Wall Cabinet Runs</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          350mm depth wall hung overhead units
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">{pricing.topLF} LF</td>
                      <td className="py-2 px-3 text-right">15,500 / LF</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {pricing.fabricatorCost.topCost.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Tall Units Run */}
                  {pricing.tallLF > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold block text-slate-900">Tall Appliance & Pantry Towers</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          2150mm vertical column enclosures
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">{pricing.tallLF} LF</td>
                      <td className="py-2 px-3 text-right">15,500 / LF</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {pricing.fabricatorCost.tallCost.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Granite Countertop */}
                  {options.granite && (
                    <tr>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold block text-slate-900">Solid Granite Countertop Slab</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          20mm polished bullnose profile with cutouts
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">{pricing.graniteSqFt} sq.ft</td>
                      <td className="py-2 px-3 text-right">3,000 / sq.ft</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {pricing.fabricatorCost.graniteCost.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Electrical & Plumbing Provisions */}
                  {options.electricalPlumbing && (
                    <tr>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold block text-slate-900">Wiring & Plumbing Factory Allowance</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Internal LED conduit channels & basic plumbing couplers
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">1 Lot</td>
                      <td className="py-2 px-3 text-right">Fixed</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {pricing.fabricatorCost.servicesCost.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Transport & Site Logistics */}
                  <tr>
                    <td className="py-2 px-3 font-sans">
                      <span className="font-bold block text-slate-900">Transport & Handling</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Factory dispatch to site location
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">1 Trip</td>
                    <td className="py-2 px-3 text-right">Fixed</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {pricing.fabricatorCost.transportCost.toLocaleString()}
                    </td>
                  </tr>

                  {/* Custom BOM Items added by user (if any) */}
                  {pricing.bomItems
                    .filter((it) => it.isCustom)
                    .map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-sans">
                          <span className="font-bold block text-slate-900">{it.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Custom Hardware Component</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 px-3 text-right">{it.unitCost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {it.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Total Contractor Settlement Box */}
            <div className="flex justify-end my-6">
              <div className="w-84 bg-amber-950 text-white p-5 rounded border border-amber-900 text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block mb-1">
                  TOTAL CONTRACTOR SETTLEMENT (NET FACTORY COST)
                </span>
                <p className="text-2xl font-black tracking-tight text-white font-mono">
                  {formatLKR(pricing.fabricatorCost.totalCost)}
                </p>
                <p className="text-[10px] text-amber-200/80 mt-1 font-sans">
                  Strictly net fabrication cost. Zero retail markup applied.
                </p>
              </div>
            </div>

            {/* Production Instructions & Sign-Off */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
                Workshop Production Mandates
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>All aluminium box frames must be cut using calibrated CNC miter saws (±0.5mm tolerance).</li>
                <li>Hinges and runners must be test-aligned with German jigs prior to factory dispatch.</li>
                <li>Granite template must be laser verified on-site prior to fabrication.</li>
              </ul>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t border-slate-300 pt-4 grid grid-cols-2 text-[10px] font-mono text-slate-600">
            <div>
              <p className="font-bold text-slate-900">Prepared by:</p>
              <p className="mt-4">Production Estimator: ____________________</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">Approved for Settlement:</p>
              <p className="mt-4">Workshop Director: ____________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
