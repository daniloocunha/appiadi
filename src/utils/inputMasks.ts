// ============================================================
// Funções de máscara para inputs — formatação em tempo real
// Estratégia: salva apenas dígitos no form, exibe com máscara
// ============================================================

/** CPF: 000.000.000-00 */
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Telefone: (00) 0000-0000 ou (00) 00000-0000 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** CEP: 00000-000 */
export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/** Data: dd/mm/aaaa (auto-formatação ao digitar) */
export function maskDate(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** dd/mm/aaaa → YYYY-MM-DD (para salvar no banco como DATE) */
export function dateDisplayToISO(v: string): string | undefined {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined
}

/** YYYY-MM-DD → dd/mm/aaaa (para exibir no formulário) */
export function dateISOToDisplay(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v
}

/** Remove formatação — retorna só dígitos (para salvar no banco) */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

// ---- Hook handler para uso com react-hook-form ----
// Uso: <input {...register('cpf')} onChange={makeMaskHandler(maskCPF, field.onChange)} />

type MaskFn = (value: string) => string

/**
 * Cria um handler de onChange que aplica máscara ao valor digitado
 * e chama o onChange original do react-hook-form com o valor formatado.
 * O valor salvo no form JÁ INCLUI a formatação visual (ex: "123.456.789-00").
 * Na hora de salvar no banco, o useMembers.ts já limpa com replace(/\D/g,'').
 */
export function makeMaskHandler(
  maskFn: MaskFn,
  originalOnChange: (value: string) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskFn(e.target.value)
    e.target.value = masked
    originalOnChange(masked)
  }
}
