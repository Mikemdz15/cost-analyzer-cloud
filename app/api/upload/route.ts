import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Validar Rol
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden cargar datos.' }, { status: 403 })
    }

    const body = await request.json()
    const { companyName, monthIndex, year, summary, runs } = body

    // 1. Insertar Historial
    const { data: history, error: historyError } = await supabase
      .from('monthly_history')
      .insert({
        company_name: companyName,
        month_index: monthIndex,
        year: year,
        summary_jsonb: summary
      })
      .select()
      .single()

    if (historyError) {
      if (historyError.code === '23505') {
        return NextResponse.json({ error: 'Este mes ya existe. Borra el anterior primero.' }, { status: 400 })
      }
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }

    // 2. Insertar Detalle Masivo (Runs)
    const productionRuns = runs.map((r: any) => ({
      history_id: history.id,
      sku: r.sku,
      run_data: r
    }))

    // Insert en bloques para no saturar memoria si son demasiados
    const chunkSize = 1000;
    for (let i = 0; i < productionRuns.length; i += chunkSize) {
      const chunk = productionRuns.slice(i, i + chunkSize);
      const { error: runsError } = await supabase.from('production_runs').insert(chunk)
      if (runsError) throw new Error(runsError.message)
    }

    return NextResponse.json({ success: true, historyId: history.id })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
