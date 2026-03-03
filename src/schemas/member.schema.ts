import { z } from 'zod'

// Constantes reutilizadas na UI
export const CHURCH_ROLES = [
  'Pastor Presidente',
  'Vice-Presidente',
  'Presbítero',
  'Diácono',
  'Obreiro',
  'Cooperador',
  'Evangelista',
  'Membro',
  'Congregado',
] as const

export const MINISTRIES = [
  'Louvor e Adoração',
  'Escola Dominical',
  'Jovens',
  'Mulheres',
  'Homens',
  'Casais',
  'Crianças',
  'Mídia e Comunicação',
  'Intercessão',
  'Evangelismo',
  'Assistência Social',
  'Dirigente de Congregação',
] as const

export const ESCOLARIDADES = [
  'Sem escolaridade',
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-graduação',
] as const

export const memberSchema = z.object({
  full_name:            z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  birth_date:           z.string().nullable().optional(),
  baptism_date:         z.string().nullable().optional(),
  holy_spirit_date:     z.string().nullable().optional(),
  father_name:          z.string().nullable().optional(),
  mother_name:          z.string().nullable().optional(),
  cpf:                  z.string().nullable().optional(),
  rg:                   z.string().nullable().optional(),
  phone:                z.string().nullable().optional(),
  phone_secondary:      z.string().nullable().optional(),
  email:                z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  address_street:       z.string().nullable().optional(),
  address_number:       z.string().nullable().optional(),
  address_complement:   z.string().nullable().optional(),
  address_neighborhood: z.string().nullable().optional(),
  address_city:         z.string().nullable().optional(),
  address_state:        z.string().nullable().optional(),
  address_zip:          z.string().nullable().optional(),
  marital_status:       z.enum(['solteiro','casado','divorciado','viuvo','separado']).nullable().optional(),
  spouse_name:          z.string().nullable().optional(),
  occupation:           z.string().nullable().optional(),
  congregation_id:      z.string().uuid('Selecione uma congregação'),
  status:               z.enum(['ativo','inativo','transferido','falecido','excluido','em_experiencia']),
  church_role:          z.string().nullable().optional(),
  ministry:             z.string().nullable().optional(),
  notes:                z.string().nullable().optional(),
  joined_at:            z.string().nullable().optional(),
  // Campos adicionais
  escolaridade:                  z.string().nullable().optional(),
  titulo_eleitor:                z.string().nullable().optional(),
  zona_eleitoral:                z.string().nullable().optional(),
  secao_eleitoral:               z.string().nullable().optional(),
  batismo_pastor:                z.string().nullable().optional(),
  batismo_local:                 z.string().nullable().optional(),
  recebeu_carta_transferencia:   z.boolean().optional(),
  data_carta_transferencia:      z.string().nullable().optional(),
  denominacao_origem:            z.string().nullable().optional(),
  naturalidade:                  z.string().nullable().optional(),
  naturalidade_uf:               z.string().nullable().optional(),
})

export type MemberFormInput = z.input<typeof memberSchema>
export type MemberFormData  = z.output<typeof memberSchema>
