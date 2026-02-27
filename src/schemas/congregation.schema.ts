import { z } from 'zod'

export const congregationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  dirigente_id: z.string().nullable().optional(),
  is_headquarters: z.boolean(),
})

// Input type (what the form uses)
export type CongregationFormInput = z.input<typeof congregationSchema>
// Output type (after parsing)
export type CongregationFormData = z.output<typeof congregationSchema>
