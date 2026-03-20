'use client'
import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'

const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
const formatCurrencyInt = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

export function AnnualSkuTable({ histories }: { histories: any[] }) {
  const [sortConfig, setSortConfig] = useState<{key: string | null, direction: 'asc'|'desc'}>({ key: 'totalVar', direction: 'asc' });

  const aggregatedData = useMemo(() => {
      const skuMap: any = {};
      if (!histories) return [];

      histories.forEach(h => {
          const details = h.summary_jsonb?.skuDetails || [];
          details.forEach((d: any) => {
              if (!skuMap[d.sku]) {
                  skuMap[d.sku] = {
                      sku: d.sku,
                      description: d.description,
                      netsuite: d.netsuite,
                      status: d.status,
                      totalUnits: 0,
                      totalStd: 0,
                      totalReal: 0
                  };
              }
              skuMap[d.sku].totalUnits += (d.totalUnits || 0);
              skuMap[d.sku].totalStd += (d.totalStd || 0);
              skuMap[d.sku].totalReal += (d.totalReal || 0);
              if (d.description) skuMap[d.sku].description = d.description;
              if (d.status) skuMap[d.sku].status = d.status;
          });
      });

      return Object.values(skuMap).map((item: any) => {
          const totalVar = item.totalStd - item.totalReal;
          const mermaPct = item.totalStd !== 0 ? ((totalVar / item.totalStd) * 100) : 0;
          return { ...item, totalVar, mermaPct };
      });
  }, [histories]);

  const sortedData = useMemo(() => {
      let sortableItems = [...aggregatedData];
      if (sortConfig.key) {
          sortableItems.sort((a: any, b: any) => {
              if (a[sortConfig.key!] < b[sortConfig.key!]) {
                  return sortConfig.direction === 'asc' ? -1 : 1;
              }
              if (a[sortConfig.key!] > b[sortConfig.key!]) {
                  return sortConfig.direction === 'asc' ? 1 : -1;
              }
              return 0;
          });
      }
      return sortableItems;
  }, [aggregatedData, sortConfig]);

  const handleSort = (key: string) => {
      let direction: 'asc'|'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const grandTotals = useMemo(() => {
      return aggregatedData.reduce((acc, curr) => ({
          units: acc.units + curr.totalUnits,
          std: acc.std + curr.totalStd,
          real: acc.real + curr.totalReal,
          var: acc.var + curr.totalVar
      }), { units: 0, std: 0, real: 0, var: 0 });
  }, [aggregatedData]);

  if (!histories || histories.length === 0) return null;

  return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-indigo-100 p-1.5 rounded-md"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg></span>
                  📊 Resumen Anualizado por SKU
              </h3>
              <button onClick={() => {
                  const headers = ["SKU", "Descripcion", "Total Pzas", "Total Std", "Total Real", "Var Neta", "Merma %"];
                  const rows = sortedData.map((i: any) => [i.sku, i.description, i.totalUnits, i.totalStd, i.totalReal, i.totalVar, (i.mermaPct / 100)]);
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                  XLSX.utils.book_append_sheet(wb, ws, "Anual_SKU");
                  XLSX.writeFile(wb, "Resumen_Anual_SKU.xlsx");
              }} className="text-xs font-bold text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Excel
              </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-300 shadow-sm bg-white max-h-96 custom-scrollbar">
              <table className="min-w-full text-xs text-left border-collapse relative">
                  <thead className="bg-[#1e293b] text-white font-semibold uppercase tracking-wider sticky top-0 z-10">
                      <tr className="divide-x divide-slate-600 bg-slate-800 border-b-2 border-slate-500">
                          <th colSpan={4} className="px-3 py-3 text-right font-bold text-yellow-400">TOTALES GLOBALES:</th>
                          <th className="px-3 py-3 text-right font-bold text-yellow-400">{grandTotals.units.toLocaleString()}</th>
                          <th className="px-3 py-3 text-right font-bold text-blue-300">{formatCurrencyInt(grandTotals.std)}</th>
                          <th className="px-3 py-3 text-right font-bold text-slate-300">{formatCurrencyInt(grandTotals.real)}</th>
                          <th className={`px-3 py-3 text-right font-bold ${grandTotals.var < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {grandTotals.var > 0 ? '+' : ''}{formatCurrencyInt(grandTotals.var)}
                          </th>
                          <th className="px-3 py-3" colSpan={2}></th>
                      </tr>

                      <tr className="divide-x divide-slate-700">
                          <th className="px-3 py-3 bg-[#0f172a]">ACUMULADO ANUAL</th>
                          <th className="px-3 py-3 cursor-pointer hover:bg-slate-700" onClick={() => handleSort('sku')}>SKU</th>
                          <th className="px-3 py-3 cursor-pointer hover:bg-slate-700" onClick={() => handleSort('description')}>Descripción</th>
                          <th className="px-3 py-3 text-center bg-[#16a34a] cursor-pointer" onClick={() => handleSort('status')}>Estatus</th>

                          <th className="px-3 py-3 text-right bg-[#22c55e] cursor-pointer" onClick={() => handleSort('totalUnits')}>Piezas Fab.</th>
                          <th className="px-3 py-3 text-right cursor-pointer" onClick={() => handleSort('totalStd')}>Importe STD</th>
                          <th className="px-3 py-3 text-right bg-[#22c55e] cursor-pointer" onClick={() => handleSort('totalReal')}>Importe Real</th>
                          <th className="px-3 py-3 text-right bg-[#0f172a]/90 cursor-pointer" onClick={() => handleSort('totalVar')}>Variación</th>

                          <th className="px-3 py-3 text-center bg-[#dc2626] cursor-pointer" onClick={() => handleSort('mermaPct')}>Merma</th>
                          <th className="px-3 py-3 text-center bg-[#002e6e] cursor-pointer" onClick={() => handleSort('netsuite')}>NetSuite</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                      {sortedData.map((skuItem: any, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-blue-50/50 divide-x divide-slate-100 group">
                              <td className="px-3 py-2 font-bold text-slate-400 bg-slate-50 text-[10px] text-center">{sIdx + 1}</td>
                              <td className="px-3 py-2 font-bold text-slate-800">{skuItem.sku}</td>
                              <td className="px-3 py-2 bg-[#fef9c3] text-slate-800 italic border-r border-[#fef9c3]">{skuItem.description}</td>
                              <td className="px-3 py-2 text-center bg-green-100/50 text-green-700 font-bold text-[10px]">{skuItem.status || 'N/A'}</td>

                              <td className="px-3 py-2 text-right font-semibold bg-green-50/50">{skuItem.totalUnits.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-slate-500">{formatCurrency(skuItem.totalStd)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(skuItem.totalReal)}</td>
                              <td className={`px-3 py-2 text-right font-bold ${skuItem.totalVar < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {skuItem.totalVar > 0 ? '+' : ''}{formatCurrency(skuItem.totalVar)}
                              </td>

                              <td className={`px-3 py-2 text-center font-bold ${skuItem.totalVar < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                  {skuItem.mermaPct.toFixed(2)}%
                              </td>
                              <td className="px-3 py-2 text-center bg-slate-100 text-slate-500 text-[10px]">{skuItem.netsuite || '-'}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );
}