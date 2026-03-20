'use client'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, CartesianGrid, ComposedChart } from 'recharts'

export function HistoricalAccumulationChart({ histories }: { histories: any[] }) {
  const data = useMemo(() => {
    if (!histories || histories.length === 0) return []
    return [...histories].sort((a, b) => {
        const yearA = a.year || 2024;
        const yearB = b.year || 2024;
        if (yearA !== yearB) return yearA - yearB;
        return a.month_index - b.month_index;
    }).map(h => {
        const std = h.summary_jsonb?.summary?.totalStdCost || 0;
        const real = h.summary_jsonb?.summary?.totalRealCost || 0;
        return {
            name: `${new Date(h.year, h.month_index - 1, 1).toLocaleString('es-MX', { month: 'short' })} ${h.year}`,
            stdCost: std,
            realCost: real,
            variance: std - real
        }
    })
  }, [histories])

  if (data.length === 0) return null

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { notation: 'compact', style: 'currency', currency: 'MXN' }).format(val);
  const formatTooltip = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg className="w-32 h-32 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
          </div>
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
              <span className="bg-slate-100 p-1.5 rounded-md"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></span>
              Acumulado Histórico Financiero
          </h3>
          <div className="h-72 relative z-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrency} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip formatter={formatTooltip} cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" />
                <Bar dataKey="stdCost" name="Importe Estándar" fill="#3b82f6" radius={[4, 4, 0, 0] as any} barSize={40} />
                <Bar dataKey="realCost" name="Costo Real" fill="#64748b" radius={[4, 4, 0, 0] as any} barSize={40} />
                <Bar dataKey="variance" name="Variación Neta" barSize={40}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.variance < 0 ? '#ef4444' : '#10b981'} stroke={entry.variance < 0 ? '#b91c1c' : '#047857'} strokeWidth={1} radius={[4, 4, 0, 0] as any} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
      </div>
  )
}