'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setRole(userId: string, role: string) {
    const supabase = await createClient();
    // Ensure caller is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard');
    return { success: true };
}
