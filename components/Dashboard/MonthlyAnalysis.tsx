'use client'
import { useState, useMemo, useTransition } from 'react'
import { saveSkuComment } from '@/app/actions/history'

const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

export function MonthlyAnalysis({ currentHistoryId, currentMonth, prevMonth, initialComments = {} }: any) {
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState<{type: string, sku: string} | null>(null);
  const [tempText, setTempText] = useState("");
  const [isPending, startTransition] = useTransition();

  const insights = useMemo(() => {
      const skus = currentMonth?.skuDetails || [];
      if (skus.length === 0) return null;

      const topMerma = [...skus].sort((a: any, b: any) => a.totalVar - b.totalVar).slice(0, 5);
      const topSavings = [...skus].sort((a: any, b: any) => b.totalVar - a.totalVar).slice(0, 5).filter((s:any) => s.totalVar > 0);
      const topVol = [...skus].sort((a: any, b: any) => b.totalUnits - a.totalUnits).slice(0, 5);

      return { topMerma, topSavings, topVol };
  }, [currentMonth]);

  if (!insights) return null;

  const handleUpdateComment = (sku: string) => {
      const newComment = tempText.trim();
      startTransition(async () => {
          const res = await saveSkuComment(currentHistoryId, sku, newComment);
          if (res.success) {
              setComments((prev: any) => ({ ...prev, [sku]: newComment }));
              setEditing(null);
          } else {
              alert("Error al guardar en Supabase");
          }
      });
  };

  const exportHighEndWord = () => {
      const activeCompanyName = "Grupo Alphalab de México";
      const record = currentMonth;
      const totalVar = record.summary.totalStdCost - record.summary.totalRealCost;
      const isPositive = totalVar > 0;
      const varPct = record.summary.totalStdCost !== 0 ? (totalVar / record.summary.totalStdCost) * 100 : 0;
      
      const topDriverName = insights.topMerma.length > 0 ? insights.topMerma[0].sku : "N/A";
      const topDriverVal = insights.topMerma.length > 0 ? formatCurrency(insights.topMerma[0].totalVar) : "$0.00";

      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
              <meta charset="utf-8">
              <title>Reporte Ejecutivo - ${record.monthName || 'Mensual'}</title>
              <style>
                  @page { size: letter; margin: 2.5cm 2.0cm; }
                  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; }
                  .company-header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
                  .company-name { font-size: 18pt; font-weight: bold; color: #0f172a; text-transform: uppercase; }
                  h2 { font-size: 13pt; color: #fff; background-color: #1e3a8a; padding: 6px 12px; margin-top: 25px; text-transform: uppercase; border-radius: 2px;}
                  p { text-align: justify; margin-bottom: 10px; }
                  table.data-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 10px; }
                  table.data-table th { background-color: #0f172a; color: white; padding: 8px; text-align: left; }
                  table.data-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                  .signatures { margin-top: 80px; width: 100%; text-align: center; }
                  .sig-line { border-top: 1px solid #333; width: 60%; margin: 0 auto; padding-top: 8px; font-weight: bold; }
              </style>
          </head>
          <body>
              <div class="company-header">
                  <div class="company-name">${activeCompanyName}</div>
                  <div>Reporte Ejecutivo de Costos de Producción - ${record.monthName || 'Mensual'}</div>
              </div>
              <h2>1. Resumen Ejecutivo y Contexto Financiero</h2>
              <p>En el periodo analizado, la variación financiera fue <strong>${isPositive ? 'FAVORABLE' : 'DESFAVORABLE'}</strong> por <strong>${formatCurrency(totalVar)}</strong> (${varPct.toFixed(2)}% vs Estándar).</p>
              <p>El principal impulsor de desviación fue el SKU <strong>${topDriverName}</strong> con un impacto de <strong>${topDriverVal}</strong>.</p>
              
              <h2>2. Análisis de Desviaciones Críticas (Top 5)</h2>
              <table class="data-table">
                  <thead><tr><th>SKU</th><th>Desviación</th><th>Justificación / Comentario</th></tr></thead>
                  <tbody>
                      ${insights.topMerma.map((i:any) => `<tr><td>${i.sku}</td><td>${formatCurrency(i.totalVar)}</td><td>${comments[i.sku] || '-'}</td></tr>`).join('')}
                  </tbody>
              </table>

              <h2>3. Detalle Completo de Producción</h2>
              <table class="data-table">
                  <thead><tr><th>SKU</th><th>Piezas</th><th>C. Real Total</th><th>Variación</th></tr></thead>
                  <tbody>
                      ${currentMonth.skuDetails.map((sku:any) => `<tr><td>${sku.sku}</td><td>${sku.totalUnits}</td><td>${formatCurrency(sku.totalReal)}</td><td>${formatCurrency(sku.totalVar)}</td></tr>`).join('')}
                  </tbody>
              </table>
              
              <table class="signatures">
                  <tr><td><div class="sig-line">Miguel Angel Méndez<br><span style="font-weight:normal;">Director de Cadena de Suministros y Costos</span></div></td></tr>
              </table>
          </body>
          </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Reporte_Director_${record.monthName || 'Mensual'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderTopList = (title: string, items: any[], type: 'worsened'|'improved'|'vol') => {
      const colors: any = {
          worsened: 'border-red-400 bg-red-50',
          improved: 'border-green-400 bg-green-50',
          vol: 'border-blue-400 bg-blue-50'
      };
      const textColors: any = {
          worsened: 'text-red-700',
          improved: 'text-green-700',
          vol: 'text-blue-700'
      };
      
      return (
          <div className="flex-1 min-w-[300px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
              <div className={`px-4 py-3 border-b-2 font-bold flex justify-between ${colors[type]} ${textColors[type]}`}>
                  <span>{title}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {items.map((item, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 group">
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-800 text-sm max-w-[60%] truncate" title={item.description}>{item.sku}</span>
                              <span className={`font-bold text-sm ${type === 'worsened' ? 'text-red-600' : 'text-slate-800'}`}>
                                  {type === 'vol' ? item.totalUnits.toLocaleString() + ' uds' : formatCurrency(item.totalVar)}
                              </span>
                          </div>
                          
                          <div className="mt-2 pl-3 border-l-2 border-slate-200">
                              {editing?.type === type && editing?.sku === item.sku ? (
                                  <div className="mt-2 flex flex-col gap-2">
                                      <textarea 
                                          className="w-full text-xs p-2 border border-blue-400 focus:ring-1 focus:ring-blue-500 rounded bg-white shadow-inner"
                                          rows={3} autoFocus value={tempText} onChange={e => setTempText(e.target.value)}
                                          placeholder="Escribe la causa raíz de esta variación para el reporte..."
                                      />
                                      <div className="flex gap-2 justify-end">
                                          <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                          <button onClick={() => handleUpdateComment(item.sku)} disabled={isPending} className="text-xs px-3 py-1 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:opacity-50">
                                              {isPending ? 'Guardando...' : 'Guardar'}
                                          </button>
                                      </div>
                                  </div>
                              ) : (
                                  <div 
                                      className="text-xs italic cursor-pointer group-hover:bg-amber-50 rounded p-1.5 transition-colors"
                                      onClick={() => { setEditing({type, sku: item.sku}); setTempText(comments[item.sku] || ""); }}
                                  >
                                      {comments[item.sku] ? (
                                          <span className="text-slate-700 flex items-start gap-1"><span className="text-amber-500">✍️</span> {comments[item.sku]}</span>
                                      ) : (
                                          <span className="text-slate-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Añadir causa para confirmación a base de datos...</span>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-slate-400 italic">No hay datos suficientes.</p>}
              </div>
          </div>
      );
  };

  return (
      <div className="space-y-6 mt-8">
          <div className="flex justify-between items-center bg-[#0f172a] text-white p-4 rounded-xl shadow-lg">
              <div>
                  <h3 className="font-black text-xl tracking-wide flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      Análisis Mensual Interactivo
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 font-medium">Motor de inteligencia con componentes integrados a Supabase</p>
              </div>
              <button onClick={exportHighEndWord} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Exportar a MS Word
              </button>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
              {renderTopList("🚨 Top 5 Fugas y Sobrecostos", insights.topMerma, 'worsened')}
              {renderTopList("✅ Top 5 Ahorros (Vs Std)", insights.topSavings, 'improved')}
              {renderTopList("📦 Top 5 Volumen de Prod.", insights.topVol, 'vol')}
          </div>
      </div>
  )
}