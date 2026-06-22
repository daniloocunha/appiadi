import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'

// ============================================================
// Numeração sequencial de documentos
// Estratégia: pega o MAIOR número existente do ano (remoto + local,
// incluindo itens ainda não sincronizados) e soma 1.
// Isso evita:
//   - offline sempre gerar "001" (a antiga contagem retornava null)
//   - contar registros com soft-delete
//   - colisão entre documentos emitidos offline no mesmo dispositivo
// Obs: ainda não é 100% atômico entre dispositivos distintos offline —
// para garantia total seria necessária uma sequence/RPC no banco.
// ============================================================

/** Extrai o maior sequencial de uma lista de números no formato PREFIX-YYYY-NNN */
function highestSeq(numbers: Array<string | null | undefined>, prefix: string, year: number): number {
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const n of numbers) {
    const m = n?.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return max
}

/** Gera número sequencial para carta — ex: "REC-2025-001" */
export async function generateLetterNumber(type: 'recomendacao' | 'transferencia'): Promise<string> {
  const prefix = type === 'recomendacao' ? 'REC' : 'TRF'
  const year = new Date().getFullYear()
  const numbers: Array<string | null | undefined> = []

  // Remoto (fonte de verdade quando online)
  try {
    const { data } = await supabase
      .from('letters')
      .select('letter_number')
      .eq('letter_type', type)
      .like('letter_number', `${prefix}-${year}-%`)
    if (data) numbers.push(...data.map((d) => d.letter_number))
  } catch {
    // offline — usa apenas o local abaixo
  }

  // Local (inclui cartas criadas offline ainda na fila de sync)
  try {
    const local = await db.letters.where('letter_type').equals(type).toArray()
    numbers.push(...local.map((l) => l.letter_number))
  } catch {
    // ignora falha local
  }

  const seq = (highestSeq(numbers, prefix, year) + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

/** Gera número sequencial para crachá — ex: "CRA-2025-001" */
export async function generateBadgeNumber(): Promise<string> {
  const prefix = 'CRA'
  const year = new Date().getFullYear()
  const numbers: Array<string | null | undefined> = []

  try {
    const { data } = await supabase
      .from('badges')
      .select('badge_number')
      .like('badge_number', `${prefix}-${year}-%`)
    if (data) numbers.push(...data.map((d) => d.badge_number))
  } catch {
    // offline
  }

  try {
    const local = await db.badges.toArray()
    numbers.push(...local.map((b) => b.badge_number))
  } catch {
    // ignora
  }

  const seq = (highestSeq(numbers, prefix, year) + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}
