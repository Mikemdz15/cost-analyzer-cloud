'use client'
import { useState, useMemo } from 'react'
import { KPICard } from './KPICard'
import { HistoricalAccumulationChart } from './HistoricalAccumulationChart'
import { MonthlyAnalysis } from './MonthlyAnalysis'
import { UnitCostComparisonTable } from './UnitCostComparisonTable'
import { AnnualSkuTable } from './AnnualSkuTable'

const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

export function DashboardView({ companyName, histories }: { companyName: string, histories: any[] }) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    histories.length > 0 ? histories[histories.length - 1].id : null
  );

  const currentHistory = useMemo(() => histories.find(h => h.id === selectedHistoryId), [selectedHistoryId, histories]);
  const prevHistory = useMemo(() => {
     if (!currentHistory) return null;
     const currentMonthIdx = Number(currentHistory.month_index);
     const currentYearNum = Number(currentHistory.year);
     
     const targetMonth = currentMonthIdx - 1;
     const targetYear = targetMonth === 0 ? currentYearNum - 1 : currentYearNum;
     const m = targetMonth === 0 ? 12 : targetMonth;
     
     return histories.find(h => Number(h.month_index) === m && Number(h.year) === targetYear);
  }, [currentHistory, histories]);

  if (!histories.length) {
     return <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-xl mt-8 border border-slate-200">No hay meses cargados. Sube un Excel para comenzar.</div>
  }

  const summary = currentHistory?.summary_jsonb?.summary;

  return (
    <div className="space-y-8 mt-12 animate-fade-in border-t border-slate-200 pt-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resultados Globales de la Empresa</h2>
          <p className="text-sm text-slate-500">Filtrando por mes específico desde la Nube (Supabase)</p>
        </div>
        <select 
          className="p-2 border border-blue-300 rounded-lg mt-4 md:mt-0 font-bold bg-blue-50 text-blue-700 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
          value={selectedHistoryId || ''} 
          onChange={e => setSelectedHistoryId(e.target.value)}
        >
          {histories.map(h => (
            <option key={h.id} value={h.id}>Mes {h.month_index} del {h.year}</option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Costo Producción Real" value={formatCurrency(summary.totalRealCost)} subtext="Total gastado en insumos" />
          <KPICard title="Costo Estándar (Ideal)" value={formatCurrency(summary.totalStdCost)} subtext="Debería haber costado" />
          <KPICard 
            title="Desviación (Merma)" 
            value={summary.variance > 0 ? '+' + formatCurrency(summary.variance) : formatCurrency(summary.variance)} 
            subtext={`${((summary.variance / summary.totalStdCost) * 100).toFixed(1)}% sobre estándar`} 
            type={summary.variance < 0 ? 'danger' : 'success'} 
          />
          <KPICard 
            title="Eficiencia Financiera" 
            value={(summary.efficiency * 100).toFixed(1) + '%'} 
            subtext="Target: 98%+" 
            type={summary.efficiency < 0.98 ? 'warning' : 'success'} 
          />
        </div>
      )}

      {/* 100% REBUILT COMPONENTS BELOW */}
      <HistoricalAccumulationChart histories={histories} />
      
      {currentHistory && (
        <MonthlyAnalysis 
          currentHistoryId={currentHistory.id}
          currentMonth={{...currentHistory.summary_jsonb, monthName: `Mes ${currentHistory.month_index}`, year: currentHistory.year}} 
          prevMonth={prevHistory ? {...prevHistory.summary_jsonb, monthName: `Mes ${prevHistory.month_index}`, year: prevHistory.year} : null}
          initialComments={currentHistory.summary_jsonb?.comments || {}}
        />
      )}

      <UnitCostComparisonTable 
          currentMonth={currentHistory?.summary_jsonb ? {...currentHistory.summary_jsonb, monthName: `Mes ${currentHistory.month_index}`} : null}
          prevMonth={prevHistory?.summary_jsonb ? {...prevHistory.summary_jsonb, monthName: `Mes ${prevHistory.month_index}`} : null}
      />

      <AnnualSkuTable histories={histories} />
    </div>
  )
}