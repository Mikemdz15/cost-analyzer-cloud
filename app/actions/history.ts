'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSkuComment(historyId: string, sku: string, comment: string) {
  const supabase = await createClient()
  
  // Fetch existing
  const { data, error } = await supabase.from('monthly_history').select('summary_jsonb').eq('id', historyId).single()
  if (error || !data) return { error: 'Not found' }
  
  const currentJson = data.summary_jsonb;
  const comments = currentJson.comments || {};
  comments[sku] = comment;
  currentJson.comments = comments;

  const { error: updateError } = await supabase.from('monthly_history').update({ summary_jsonb: currentJson }).eq('id', historyId)
  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard')
  return { success: true }
}
