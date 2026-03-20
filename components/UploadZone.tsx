'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'

export function UploadZone({ companyName }: { companyName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('')
  const router = useRouter()

  const months = [
    { val: 1, label: 'Enero' }, { val: 2, label: 'Febrero' }, { val: 3, label: 'Marzo' },
    { val: 4, label: 'Abril' }, { val: 5, label: 'Mayo' }, { val: 6, label: 'Junio' },
    { val: 7, label: 'Julio' }, { val: 8, label: 'Agosto' }, { val: 9, label: 'Septiembre' },
    { val: 10, label: 'Octubre' }, { val: 11, label: 'Noviembre' }, { val: 12, label: 'Diciembre' }
  ]

  const cleanCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = val.toString().replace(/[$,]/g, '').trim();
    return parseFloat(cleanStr) || 0;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMonth) return;

    setLoading(true); setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      if (jsonData.length < 2) throw new Error("El archivo está vacío");

      const rows = jsonData.slice(1).filter(r => r && r.length > 5 && r[0] !== undefined);
      const fileMonth = parseInt(rows[0][0]);

      if (parseInt(selectedMonth) !== fileMonth) {
        throw new Error("El mes seleccionado no coincide con el mes de los datos del Excel.");
      }

      const processedRuns: any[] = [];
      const virtualBOM: any = {};

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 5 || !row[2]) continue;

        const unitCost = cleanCurrency(row[11]);
        const realQty = cleanCurrency(row[10]);
        const stdQtyTotal = cleanCurrency(row[13]);
        const producedUnits = cleanCurrency(row[5]);

        const runId = `${row[2]}-${row[1]}`;

        const runItem = {
          id: runId,
          originalOrderId: row[2].toString(),
          date: `Mes ${selectedMonth} - Sem ${row[1]}`,
          weekId: `Semana ${row[1]}`,
          sku: row[3],
          skuDesc: row[4],
          units: producedUnits,
          plannedUnits: cleanCurrency(row[6]),
          component: row[8],
          componentName: row[7],
          realQty,
          stdQtyTotal,
          unitCost,
          realCost: realQty * unitCost,
          stdCost: stdQtyTotal * unitCost,
          variance: (stdQtyTotal - realQty) * unitCost
        };

        processedRuns.push(runItem);

        if (!virtualBOM[runItem.sku]) virtualBOM[runItem.sku] = {};
        if (!virtualBOM[runItem.sku][runItem.component]) {
            virtualBOM[runItem.sku][runItem.component] = {
                stdQty: producedUnits > 0 ? (stdQtyTotal / producedUnits) : 0,
                cost: unitCost,
                type: 'Raw Material'
            };
        }
      }

      // 3. AGGREGATE SUMMARY (By Component & By SKU)
      let totalStdCost = 0;
      let totalRealCost = 0;
      const varianceByComponent: any = {};
      const skuAggregates: any = {};

      const maxUnitsByRun: any = {};
      processedRuns.forEach(r => {
          if (!maxUnitsByRun[r.id] || r.units > maxUnitsByRun[r.id]) {
              maxUnitsByRun[r.id] = r.units;
          }
      });

      processedRuns.forEach(run => {
          totalStdCost += run.stdCost;
          totalRealCost += run.realCost;

          // Component Aggregate
          if (!varianceByComponent[run.component]) {
              varianceByComponent[run.component] = {
                  name: run.componentName || run.component,
                  description: run.component,
                  totalVariance: 0,
                  totalReal: 0,
                  totalStd: 0
              };
          }
          varianceByComponent[run.component].totalVariance += run.variance;
          varianceByComponent[run.component].totalReal += run.realCost;
          varianceByComponent[run.component].totalStd += run.stdCost;

          // SKU Aggregate
          if (!skuAggregates[run.sku]) {
              skuAggregates[run.sku] = {
                  sku: run.sku,
                  description: run.skuDesc || run.sku,
                  status: 'CERRADA',
                  netsuite: 'CERRADA',
                  totalUnits: 0,
                  totalPlanned: 0,
                  processedOrders: new Set(),
                  totalReal: 0,
                  totalStd: 0,
                  totalVar: 0
              };
          }

          if (!skuAggregates[run.sku].processedOrders.has(run.id)) {
              const validUnits = maxUnitsByRun[run.id] || 0;
              skuAggregates[run.sku].totalUnits += validUnits;
              skuAggregates[run.sku].totalPlanned += (run.plannedUnits || validUnits);
              skuAggregates[run.sku].processedOrders.add(run.id);
          }

          skuAggregates[run.sku].totalReal += run.realCost;
          skuAggregates[run.sku].totalStd += run.stdCost;
          skuAggregates[run.sku].totalVar += run.variance;
      });

      // Format SKU Details for Output
      const skuDetails = Object.values(skuAggregates).map((item: any) => {
          const efficiencyProd = item.totalPlanned > 0 ? (item.totalUnits / item.totalPlanned) : 0;
          return {
              sku: item.sku,
              description: item.description,
              status: item.status,
              netsuite: item.netsuite,
              totalPlanned: item.totalPlanned,
              totalUnits: item.totalUnits,
              totalReal: item.totalReal,
              totalStd: item.totalStd,
              totalVar: item.totalVar,
              efficiencyProd: efficiencyProd,
              mermaPct: item.totalStd > 0 ? (item.totalVar / item.totalStd) * 100 : 0
          };
      });

      const summary = {
        totalStdCost,
        totalRealCost,
        variance: totalStdCost - totalRealCost,
        efficiency: totalRealCost > 0 ? (totalStdCost / totalRealCost) : 0,
        skuDetails: skuDetails.sort((a: any, b: any) => a.totalVar - b.totalVar),
        details: Object.values(varianceByComponent).sort((a: any, b: any) => a.totalVariance - b.totalVariance),
        boms: virtualBOM
      };

      alert('Excel analizado. Enviando ' + processedRuns.length + ' filas a Supabase...');

      // 2. ENVIAR A SUPABASE API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          monthIndex: parseInt(selectedMonth),
          year: selectedYear,
          summary,
          runs: processedRuns
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al guardar en la nube');

      alert('¡Carga exitosa a la Nube! Los datos ya están persistidos globalmente.');
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
        Configuración de Carga a la Base de Datos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div><label className="block text-sm font-medium mb-2">Año</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full rounded-lg border-slate-300 p-2 border">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select></div>
        <div><label className="block text-sm font-medium mb-2">Mes</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border">
            <option value="" disabled>-- Selecciona un Mes --</option>
            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select></div>
      </div>
      <div className="p-12 border-2 border-dashed rounded-2xl relative">
        {selectedMonth && <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".xlsx, .xls" />}
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">{selectedMonth ? 'Sube tu Archivo Excel Original' : 'Selecciona un mes primero'}</h3>
          {loading && <p className="text-blue-600 font-bold mt-4 animate-pulse">Protegiendo datos e insertando en Supabase...</p>}
          {error && <p className="text-red-500 font-bold mt-4">{error}</p>}
        </div>
      </div>
    </div >
  )
}
