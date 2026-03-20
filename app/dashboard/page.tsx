import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UploadZone } from '@/components/UploadZone'
import { DashboardView } from '@/components/Dashboard/DashboardView'
import { UserManagement } from '@/components/UserManagement'

export const dynamic = 'force-dynamic'

export default async function DashboardMain() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single()
  
  // Registro automático en base de datos al entrar por primera vez
  if (!profile) {
    await supabase.from('profiles').insert({ id: user.id, email: user.email, role: 'pending' })
    profile = { role: 'pending', email: user.email }
  } else if (!profile.email && user.email) {
    await supabase.from('profiles').update({ email: user.email }).eq('id', user.id)
    profile.email = user.email
  }

  // Pantalla de bloqueo para usuarios pendientes
  if (profile.role === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-10 border border-slate-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Pendiente</h2>
          <p className="text-slate-600 mb-6">Tu cuenta ha sido registrada exitosamente, pero está esperando la autorización del Administrador.</p>
          <p className="text-sm border p-4 rounded-lg bg-slate-50 text-slate-500 font-medium">Por favor contacta a Miguel Mendez para que habilite tu acceso al visor de costos.</p>
          <div className="mt-8">
            <form action={async () => { 'use server'; await supabase.auth.signOut(); redirect('/login'); }}>
              <button type="submit" className="text-blue-600 font-semibold hover:underline">← Regresar e Iniciar con otra cuenta</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'
  const companyName = 'Grupo Alphalab de México'
  
  let allProfiles = [];
  if (isAdmin) {
    const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (pData) allProfiles = pData;
  }

  // Refresca la lista de historiales de la nube al instante
  const { data: histories } = await supabase.from('monthly_history').select('id, month_index, year, summary_jsonb').eq('company_name', companyName).order('year', { ascending: true }).order('month_index', { ascending: true })

  return (
    <div className="p-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          Panel de Control Ejecutivo
          <span className="bg-blue-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm shadow-blue-500/50">Cloud</span>
        </h1>
        <p className="mt-2 text-slate-600">Sesión iniciada como: <span className="font-semibold text-blue-600">{user.email}</span></p>

        {isAdmin && (
          <div className="mt-10 mb-2 space-y-4">
             <UploadZone companyName={companyName} />
             <UserManagement profiles={allProfiles} />
          </div>
        )}

        <DashboardView companyName={companyName} histories={histories || []} />
      </div>
    </div>
  )
}
