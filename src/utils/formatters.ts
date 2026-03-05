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

export function formatAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '—'
  const d = parseISO(birthDate)
  if (!isValid(d)) return '—'
  const today = new Date()
  const age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  const finalAge = m < 0 || (m === 0 && today.getDate() < d.getDate()) ? age - 1 : age
  return `${finalAge} anos`
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

// ---- CEP ----

export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '—'
  const digits = cep.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return cep
}

// ---- Status do membro ----

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  transferido: 'Transferido',
  falecido: 'Falecido',
  excluido: 'Excluído',
  em_experiencia: 'Em Experiência',
}

export const MEMBER_STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-gray-100 text-gray-700',
  transferido: 'bg-amber-100 text-amber-800',
  falecido: 'bg-slate-200 text-slate-700',
  excluido: 'bg-red-100 text-red-800',
  em_experiencia: 'bg-yellow-100 text-yellow-800',
}

// ---- Estado civil ----

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  separado: 'Separado(a)',
}

// ---- Papel no sistema ----

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  secretario: 'Secretário(a)',
  lideranca_plena: 'Pastor / Liderança',
  presbitero: 'Presbítero',
  diacono_obreiro: 'Diácono / Obreiro',
}
