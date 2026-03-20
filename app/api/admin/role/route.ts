import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { userId, role } = await request.json();
        
        if (!userId || !role) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        // Ensure we execute queries in the context of the user JWT so RLS policies pass
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    }
                }
            }
        );
        
        // Verificamos que el usuario actual autenticado sea administrador
        const { data: { user }, error: authError } = token 
            ? await supabase.auth.getUser(token)
            : await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: profile, error: profileErr } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: `Se requieren permisos de administrador. Rol actual: ${profile?.role || 'Ninguno'}. Error: ${profileErr?.message || ''}` }, { status: 403 });
        }

        // Ejecutamos el cambio de rol usando una función segura que ignora bloqueos RLS
        const { error: updateError } = await supabase.rpc('admin_update_role', { 
            target_user_id: userId, 
            new_role: role 
        });
        
        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
