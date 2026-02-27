import { supabase } from '@/lib/supabase'

/** Gera número sequencial para carta — ex: "REC-2025-001" */
export async function generateLetterNumber(type: 'recomendacao' | 'transferencia'): Promise<string> {
  const prefix = type === 'recomendacao' ? 'REC' : 'TRF'
  const year = new Date().getFullYear()

  // Conta quantas cartas deste tipo foram emitidas neste ano
  const { count } = await supabase
    .from('letters')
    .select('*', { count: 'exact', head: true })
    .eq('letter_type', type)
    .gte('issued_at', `${year}-01-01`)

  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

/** Gera número sequencial para crachá — ex: "CRA-2025-001" */
export async function generateBadgeNumber(): Promise<string> {
  const year = new Date().getFullYear()

  const { count } = await supabase
    .from('badges')
    .select('*', { count: 'exact', head: true })
    .gte('issued_at', `${year}-01-01`)

  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `CRA-${year}-${seq}`
}
