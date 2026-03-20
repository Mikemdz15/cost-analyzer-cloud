export function KPICard({ title, value, subtext, type = 'default' }: any) {
  const colors = {
    default: 'border-l-blue-500 bg-white text-slate-800',
    success: 'border-l-green-500 bg-green-50 text-green-800',
    warning: 'border-l-amber-500 bg-amber-50 text-amber-800',
    danger: 'border-l-red-500 bg-red-50 text-red-800',
  }
  return (
    <div className={`p-4 rounded-xl border border-slate-200 border-l-4 shadow-sm ${colors[type as keyof typeof colors]}`}>
      <h4 className="text-sm font-semibold opacity-80 mb-1">{title}</h4>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs opacity-70 mt-1 font-medium">{subtext}</p>
    </div>
  )
}
