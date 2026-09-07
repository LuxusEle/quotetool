'use client';

import React, { useRef } from 'react';
import {
  ProjectDetails,
  CalculatedPricing,
  DesignOptions,
  Cabinet,
  Wall,
  PricingSettings,
} from '@/types/kitchen';
import { Download, Share2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QuoteDocumentProps {
  project: ProjectDetails;
  pricing: CalculatedPricing;
  options: DesignOptions;
  cabinets: Cabinet[];
  walls: Wall[];
  settings: PricingSettings;
  isOwnerRole: boolean;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({
  project,
  pricing,
  options,
  cabinets,
  walls,
  settings,
  isOwnerRole,
}) => {
  const quoteRef = useRef<HTMLDivElement>(null);

  const formatLKR = (amount: number) => {
    return (
      'LKR ' +
      amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handleDownloadPdf = async () => {
    if (!quoteRef.current) return;
    try {
      const element = quoteRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
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

      pdf.save(`${project.refNumber}_LUXUS_Kitchen_Quotation.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Dear ${project.customerName},\n\n` +
        `Thank you for consulting LUXUS ELEMENTE for your aluminium kitchen.\n` +
        `Please find your project quotation *${project.refNumber}* (Rev ${project.revision}).\n\n` +
        `*Scope of Supply:*\n` +
        `• Custom Fabricated Aluminium Base Cabinetry Runs\n` +
        (options.topCabinets ? `• Upper Wall / Top Storage Cabinetry\n` : '') +
        (pricing.tallLF > 0 ? `• Full Height Tall Appliance & Pantry Housing\n` : '') +
        (options.granite ? `• Solid Granite Countertop Surface\n` : '') +
        (options.island.enabled ? `• Feature Centre Island (${options.island.length}mm × ${options.island.depth}mm)\n` : '') +
        `\n*Total Client Investment: ${formatLKR(pricing.customerPrice.grandTotal)}*\n\n` +
        `We look forward to confirming your order.\n` +
        `Best regards,\nLUXUS ELEMENTE (PVT) LTD`
    );

    const cleanNumber = project.mobile.replace(/[^0-9]/g, '');
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">
            {project.refNumber} R{project.revision}
          </span>
          <span className="text-sm font-medium text-slate-300">
            {project.customerName || 'Customer Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-lg transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg transition-all"
          >
            <Share2 className="w-4 h-4" /> Share WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual Printable Document Container (A4 Proportional Sheet) */}
      <div className="flex justify-center overflow-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800">
        <div
          ref={quoteRef}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-12 shadow-2xl flex flex-col justify-between font-sans selection:bg-sky-100"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header Block */}
          <div>
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <h1 className="text-3xl font-black tracking-wider text-slate-900">
                  LUXUS <span className="text-sky-600 font-light">ELEMENTE</span>
                </h1>
                <p className="text-xs tracking-widest text-slate-500 uppercase mt-1 font-semibold">
                  Architectural Aluminium Kitchen Systems
                </p>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                  <p>No. 42A, Galle Road, Colombo 03, Sri Lanka</p>
                  <p>Hotline: +94 11 234 5678 | luxusele.lk</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-sm mb-2">
                  QUOTATION
                </span>
                <p className="text-sm font-bold text-slate-900">{project.refNumber}</p>
                <p className="text-xs text-slate-500">Rev: {project.revision} (Draft/Quoted)</p>
                <p className="text-xs text-slate-500 mt-1">
                  Date:{' '}
                  {new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Customer & Site Details Grid */}
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  Client Details
                </span>
                <p className="text-sm font-bold text-slate-900">{project.customerName || 'N/A'}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {project.mobile || 'Phone not provided'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  Site Location & Specification
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {project.location || 'Colombo'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Finish: <span className="font-medium text-slate-900">{options.finish}</span>
                </p>
              </div>
            </div>

            {/* Description & Scope Section - EXACT PDF FORMAT: NO LINEAR FEET EXPOSED */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                Project Scope & Architectural Specification
              </h3>
              <p className="text-xs leading-relaxed text-slate-700 mb-3">
                Custom fabricated high-precision aluminium kitchen cabinetry designed according to the
                approved layout and dimensions. Engineered with 100% moisture-proof, termite-resistant
                anodized aluminium sub-structures, German soft-close mechanisms, and custom panel profiling.
              </p>

              {/* Itemized Cabinetry Table (Strictly Scope & Inclusions - NO LINEAR FEET SHOWN) */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-2.5 px-3 font-semibold">Scope Item</th>
                    <th className="py-2.5 px-3 font-semibold">Technical Specification</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Base Cabinetry Runs</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      Standard 600mm carcass depth with internal soft-close organizers & aluminium drawer banks
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                  </tr>

                  {options.topCabinets && (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Wall / Top Cabinetry</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        350mm depth upper overhead aluminium wall storage units with concealed lift fittings
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                    </tr>
                  )}

                  {pricing.tallLF > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        Tall Appliance / Pantry Units
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Full height 2150mm vertical refrigerator housing and pantry tower enclosures
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                    </tr>
                  )}

                  {options.granite && (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        Granite Countertop Surface
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Solid premium granite worktop with bullnose edge profiling and sink/hob cutouts
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                    </tr>
                  )}

                  {options.electricalPlumbing && (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        Electrical & Plumbing Provision
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Internal conduit routing, under-cabinet lighting channels, and inlet/outlet connections
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                    </tr>
                  )}

                  {options.island.enabled && (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Centre Feature Island</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {options.island.length}mm × {options.island.depth}mm feature island with double-sided aluminium cabinetry
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-700">Included</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Quotation Investment Block - ONE CUSTOMER-FACING AMOUNT */}
            <div className="flex justify-end my-6">
              <div className="w-80 bg-slate-900 text-white p-5 rounded-md shadow-md text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 block mb-1">
                  TOTAL CLIENT AMOUNT (NET)
                </span>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formatLKR(pricing.customerPrice.grandTotal)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Includes complete custom fabrication, site delivery, and installation.
                </p>
              </div>
            </div>

            {/* DYNAMIC TERMS & CONDITIONS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 text-xs mb-1">
                Terms & Conditions
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <span className="font-bold text-slate-800">Payment Terms:</span>{' '}
                  {settings.advancePercent}% advance upon project confirmation; 15% final payment upon
                  installation handover.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Production Period:</span> Approximately{' '}
                  {settings.leadTimeDays} working days from final laser site measurement.
                </li>

                {/* CONDITIONAL GRANITE TERM */}
                <li>
                  {options.granite ? (
                    <span className="text-slate-900 font-semibold">
                      Granite worktop is included as described in the quotation above.
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      Granite / worktop shall be provided and installed directly by the customer.
                    </span>
                  )}
                </li>

                {/* CONDITIONAL ELECTRICAL/PLUMBING TERM */}
                <li>
                  {options.electricalPlumbing ? (
                    <span className="text-slate-900 font-semibold">
                      Basic electrical conduit and plumbing provisions within the described scope are included.
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      Electrical points, wiring, and plumbing works are excluded and must be provided by the customer.
                    </span>
                  )}
                </li>

                <li>
                  <span className="font-semibold text-slate-800">Preliminary Design Note:</span> All
                  drawings and dimensions are preliminary and subject to final on-site verification before fabrication.
                </li>
              </ul>
            </div>
          </div>

          {/* Bank & Authorized Signature Footer */}
          <div className="pt-6 border-t border-slate-200 mt-6 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
            <div>
              <p className="font-bold uppercase text-slate-800 mb-0.5">Banking Details</p>
              <p className="whitespace-pre-line text-slate-600">{settings.bankDetails}</p>
            </div>
            <div className="text-right flex flex-col justify-between items-end">
              <div>
                <p className="font-bold uppercase text-slate-800 mb-0.5">Authorised Signatory</p>
                <p className="text-slate-600">LUXUS ELEMENTE (PVT) LTD</p>
              </div>
              <div className="w-40 border-b border-slate-400 mt-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
