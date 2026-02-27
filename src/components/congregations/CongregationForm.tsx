import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { congregationSchema, type CongregationFormInput } from '@/schemas/congregation.schema'
import type { CongregationFormData } from '@/schemas/congregation.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Congregation, Member } from '@/types'
import { db } from '@/lib/db'

interface CongregationFormProps {
  initialData?: Congregation
  onSave: (data: CongregationFormData) => Promise<void>
  onCancel: () => void
}

export function CongregationForm({ initialData, onSave, onCancel }: CongregationFormProps) {
  const [obreiros, setObreiros] = useState<Member[]>([])

  // Carrega membros que podem ser dirigentes (Obreiro, Evangelista, Diácono, Presbítero, etc.)
  useEffect(() => {
    db.members
      .filter((m) => !m.deleted_at && m.status === 'ativo')
      .toArray()
      .then((all) => {
        const eligible = (all as Member[]).filter((m) =>
          ['Obreiro', 'Evangelista', 'Diácono', 'Presbítero', 'Vice-Presidente', 'Pastor Presidente'].includes(
            m.church_role ?? ''
          )
        )
        eligible.sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))
        setObreiros(eligible)
      })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CongregationFormInput>({
    resolver: zodResolver(congregationSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      address: initialData?.address ?? '',
      city: initialData?.city ?? 'Iaçu',
      neighborhood: initialData?.neighborhood ?? '',
      phone: initialData?.phone ?? '',
      is_headquarters: initialData?.is_headquarters ?? false,
      dirigente_id: initialData?.dirigente_id ?? null,
    },
  })

  return (
    <form
      onSubmit={handleSubmit(async (raw) => {
        const data: CongregationFormData = {
          name: raw.name,
          address: raw.address || null,
          city: raw.city || null,
          neighborhood: raw.neighborhood || null,
          phone: raw.phone || null,
          dirigente_id: raw.dirigente_id || null,
          is_headquarters: raw.is_headquarters ?? false,
        }
        await onSave(data)
      })}
      className="flex flex-col gap-4"
    >
      <Input
        label="Nome da Congregação"
        placeholder="Ex: Congregação Bela Vista"
        required
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Bairro"
          placeholder="Centro"
          error={errors.neighborhood?.message}
          {...register('neighborhood')}
        />
        <Input
          label="Cidade"
          placeholder="Iaçu"
          error={errors.city?.message}
          {...register('city')}
        />
      </div>

      <Input
        label="Endereço"
        placeholder="Rua, número"
        error={errors.address?.message}
        {...register('address')}
      />

      <Input
        label="Telefone"
        type="tel"
        placeholder="(75) 99999-9999"
        error={errors.phone?.message}
        {...register('phone')}
      />

      {/* Dirigente */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Dirigente</label>
        {obreiros.length === 0 ? (
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <strong>Dirigente:</strong> Poderá ser atribuído após o cadastro dos membros obreiros.
          </div>
        ) : (
          <select
            className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('dirigente_id')}
          >
            <option value="">Nenhum dirigente atribuído</option>
            {obreiros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.church_role})
              </option>
            ))}
          </select>
        )}
        {errors.dirigente_id && (
          <p className="text-xs text-red-500">{errors.dirigente_id.message}</p>
        )}
      </div>

      {/* Sede */}
      {!initialData?.is_headquarters && (
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            {...register('is_headquarters')}
          />
          Esta é a sede principal (IADI)
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {initialData ? 'Salvar alterações' : 'Criar congregação'}
        </Button>
      </div>
    </form>
  )
}
