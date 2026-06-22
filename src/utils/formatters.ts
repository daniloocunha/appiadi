import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---- Datas ----

export function formatDate(
  date: string | Date | null | undefined,
  style: 'short' | 'long' | 'month-day' = 'short'
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'

  switch (style) {
    case 'short':
      return format(d, 'dd/MM/yyyy', { locale: ptBR })
    case 'long':
      return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    case 'month-day':
      return format(d, "d 'de' MMMM", { locale: ptBR })
  }
}

export function getMonthName(month: number): string {
  // month: 1-12
  const d = new Date(2000, month - 1, 1)
  return format(d, 'MMMM', { locale: ptBR })
}

// ---- Telefone ----

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

// ---- CPF ----

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '—'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  return cpf
}
