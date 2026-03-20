'use client'
import * as XLSX from 'xlsx'

const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
const formatCurrencyInt = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(val);

export function UnitCostComparisonTable({ currentMonth, prevMonth }: { currentMonth: any, prevMonth: any }) {
  if (!prevMonth || !prevMonth.skuDetails) {
      return (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
              <h3 className="font-bold text-slate-800 mb-2">Comparativo de Costos Unitarios</h3>
              <p className="text-sm text-slate-400">No hay mes anterior disponible para realizar la comparación.</p>
          </div>
      );
  }

  const prevSkusMap = new Map();
  prevMonth.skuDetails.forEach((s: any) => prevSkusMap.set(s.sku, s));

  // Combine SKUs from both months to ensure full coverage
  const allSkuNames = Array.from(new Set([...currentMonth.skuDetails.map((s: any) => s.sku), ...prevMonth.skuDetails.map((s: any) => s.sku)]));

  const rows = allSkuNames.map((sku: any) => {
      const curr = currentMonth.skuDetails.find((s: any) => s.sku === sku) || { totalUnits: 0, totalReal: 0, realUnitCost: 0 };
      const prev = prevSkusMap.get(sku) || { totalUnits: 0, totalReal: 0, realUnitCost: 0 };

      // Calculate Unit Costs (Sanity check vs stored value)
      const currUnitCost = curr.totalUnits > 0 ? curr.totalReal / curr.totalUnits : 0;
      const prevUnitCost = prev.totalUnits > 0 ? prev.totalReal / prev.totalUnits : 0;

      const varAmount = currUnitCost - prevUnitCost;
      const varPct = prevUnitCost > 0 ? (varAmount / prevUnitCost) * 100 : 0;

      // User Rule: < 0% Red, > 0% Green
      const isRed = varPct < 0;
      const isGreen = varPct > 0;
      const colorClass = isRed ? 'text-red-600 font-bold' : (isGreen ? 'text-green-600 font-bold' : 'text-slate-500');
      const bgClass = isRed ? 'bg-red-50' : (isGreen ? 'bg-green-50' : '');

      return {
          sku,
          prevUnits: prev.totalUnits,
          prevTotal: prev.totalReal,
          prevUnitCost,
          currUnits: curr.totalUnits,
          currTotal: curr.totalReal,
          currUnitCost,
          varAmount,
          varPct,
          colorClass,
          bgClass
      };
  }).sort((a, b) => a.sku.localeCompare(b.sku)); // Sort Alphabetically

  const exportComparisonToExcel = () => {
      const wsData = rows.map(r => ({
          SKU: r.sku,
          [`Piezas Prod (${prevMonth.monthName})`]: r.prevUnits,
          [`Costo Real (${prevMonth.monthName})`]: r.prevTotal,
          [`Costo Unitario (${prevMonth.monthName})`]: r.prevUnitCost,
          [`Piezas Prod (${currentMonth.monthName})`]: r.currUnits,
          [`Costo Real (${currentMonth.monthName})`]: r.currTotal,
          [`Costo Unitario (${currentMonth.monthName})`]: r.currUnitCost,
          'Variación $': r.varAmount,
          'Variación %': r.varPct / 100 // Format as pct in Excel
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Comparativo Mensual");
      XLSX.writeFile(wb, `Comparativo_Unitario_${currentMonth.monthName}_vs_${prevMonth.monthName}.xlsx`);
  };

  return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h3 className="font-bold text-lg text-slate-800">Comparativo de Costos Unitarios</h3>
                  <p className="text-sm text-slate-500">Mes Actual ({currentMonth.monthName}) vs Mes Anterior ({prevMonth.monthName})</p>
              </div>
              <button
                  onClick={exportComparisonToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                  Exportar Comparativo
              </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] custom-scrollbar">
              <table className="min-w-full text-xs text-right border-collapse relative">
                  <thead className="bg-[#0f172a] text-white font-semibold uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                      <tr>
                          <th className="px-3 py-3 text-left sticky left-0 z-30 bg-[#0f172a] border-r border-slate-600">SKU</th>
                          <th colSpan={3} className="px-3 py-2 text-center border-r border-slate-600 bg-slate-800/50">{prevMonth.monthName} (Anterior)</th>
                          <th colSpan={3} className="px-3 py-2 text-center border-r border-slate-600 bg-blue-900/50">{currentMonth.monthName} (Actual)</th>
                          <th colSpan={2} className="px-3 py-2 text-center bg-slate-800/50">Variación</th>
                      </tr>
                      <tr className="text-[10px] bg-slate-100 text-slate-600">
                          <th className="px-3 py-2 text-left bg-slate-200 sticky left-0 z-20 border-r border-slate-300 font-bold text-slate-800">Etiquetas de fila</th>

                          <th className="px-2 py-2 border-r border-slate-300">Piezas Prod.</th>
                          <th className="px-2 py-2 border-r border-slate-300">Costo Real Total</th>
                          <th className="px-2 py-2 border-r border-slate-400 font-bold bg-slate-200">Costo Unitario</th>

                          <th className="px-2 py-2 border-r border-blue-200 bg-blue-50">Piezas Prod.</th>
                          <th className="px-2 py-2 border-r border-blue-200 bg-blue-50">Costo Real Total</th>
                          <th className="px-2 py-2 border-r border-blue-300 bg-blue-100 font-bold text-blue-900 border-l border-blue-300">Costo Unitario</th>

                          <th className="px-2 py-2 border-r border-slate-300 bg-slate-50">Variación $</th>
                          <th className="px-2 py-2 bg-slate-50">%</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                      {rows.map((row) => (
                          <tr key={row.sku} className={`hover:bg-slate-50 transition-colors border-b border-slate-100 group`}>
                              <td className={`px-3 py-2 text-left font-bold text-slate-800 sticky left-0 border-r border-slate-200 ${row.bgClass || 'bg-white group-hover:bg-slate-50'}`}>{row.sku}</td>

                              <td className="px-2 py-2 border-r border-slate-100">{row.prevUnits ? row.prevUnits.toLocaleString() : '-'}</td>
                              <td className="px-2 py-2 border-r border-slate-100">{row.prevTotal ? formatCurrencyInt(row.prevTotal) : '-'}</td>
                              <td className="px-2 py-2 border-r border-slate-200 font-medium bg-slate-50/50">{row.prevUnitCost ? formatCurrency(row.prevUnitCost) : '-'}</td>

                              <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/10 font-medium">{row.currUnits ? row.currUnits.toLocaleString() : '-'}</td>
                              <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/10 font-medium">{row.currTotal ? formatCurrencyInt(row.currTotal) : '-'}</td>
                              <td className="px-2 py-2 border-r border-slate-200 bg-blue-50/30 font-bold text-slate-800 border-l border-blue-100">{row.currUnitCost ? formatCurrency(row.currUnitCost) : '-'}</td>

                              <td className={`px-2 py-2 border-r border-slate-100 font-semibold ${row.colorClass}`}>
                                  {formatCurrency(row.varAmount)}
                              </td>
                              <td className={`px-2 py-2 font-bold ${row.colorClass} ${row.bgClass}`}>
                                  {row.varPct !== 0 ? `(${row.varPct.toFixed(1)}%)` : '-'}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );
}