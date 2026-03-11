import { useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, CHURCH_ROLES, MINISTRIES, ESCOLARIDADES } from '@/schemas/member.schema'
import type { MemberFormInput, MemberFormData } from '@/schemas/member.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import type { Member, Congregation } from '@/types'
import { Camera, X, Check } from 'lucide-react'
import { maskCPF, maskPhone, maskCEP, maskDate, dateDisplayToISO, dateISOToDisplay } from '@/utils/inputMasks'
import { usePermission } from '@/hooks/usePermission'

interface MemberFormProps {
  initialData?: Member
  congregations: Congregation[]
  onSave: (data: MemberFormData, photoFile: File | null) => Promise<void>
  onCancel: () => void
}

// ---- Componente de seção ----
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ---- Select reutilizável ----
function SelectField({
  label,
  error,
  children,
  required,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        className={[
          'h-9 w-full rounded-lg border px-3 py-2 text-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-colors',
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-slate-200 text-slate-800',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ---- TextArea reutilizável ----
function TextArea({
  label,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <textarea
        rows={3}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm bg-white resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-colors',
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-slate-200 text-slate-800',
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function MemberForm({ initialData, congregations, onSave, onCancel }: MemberFormProps) {
  const { canDeleteMembers } = usePermission()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url ?? null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: initialData?.full_name ?? '',
      birth_date: initialData?.birth_date ? dateISOToDisplay(initialData.birth_date) : '',
      baptism_date: initialData?.baptism_date ? dateISOToDisplay(initialData.baptism_date) : '',
      holy_spirit_date: initialData?.holy_spirit_date ? dateISOToDisplay(initialData.holy_spirit_date) : '',
      father_name: initialData?.father_name ?? '',
      mother_name: initialData?.mother_name ?? '',
      naturalidade: initialData?.naturalidade ?? '',
      naturalidade_uf: initialData?.naturalidade_uf ?? '',
      cpf: initialData?.cpf ?? '',
      rg: initialData?.rg ?? '',
      phone: initialData?.phone ?? '',
      phone_secondary: initialData?.phone_secondary ?? '',
      email: initialData?.email ?? '',
      address_street: initialData?.address_street ?? '',
      address_number: initialData?.address_number ?? '',
      address_complement: initialData?.address_complement ?? '',
      address_neighborhood: initialData?.address_neighborhood ?? '',
      address_city: initialData?.address_city ?? 'Iaçu',
      address_state: initialData?.address_state ?? 'BA',
      address_zip: initialData?.address_zip ?? '',
      marital_status: initialData?.marital_status ?? undefined,
      spouse_name: initialData?.spouse_name ?? '',
      occupation: initialData?.occupation ?? '',
      congregation_id: initialData?.congregation_id ?? '',
      status: initialData?.status ?? 'ativo',
      church_role: initialData?.church_role ?? '',
      ministry: initialData?.ministry ?? '',
      ministries: initialData?.ministries ?? [],
      is_congregation_leader: initialData?.is_congregation_leader ?? false,
      notes: initialData?.notes ?? '',
      joined_at: initialData?.joined_at ? dateISOToDisplay(initialData.joined_at) : '',
      escolaridade: initialData?.escolaridade ?? '',
      titulo_eleitor: initialData?.titulo_eleitor ?? '',
      zona_eleitoral: initialData?.zona_eleitoral ?? '',
      secao_eleitoral: initialData?.secao_eleitoral ?? '',
      batismo_pastor: initialData?.batismo_pastor ?? '',
      batismo_local: initialData?.batismo_local ?? '',
      recebeu_carta_transferencia: initialData?.recebeu_carta_transferencia ?? false,
      data_carta_transferencia: initialData?.data_carta_transferencia ? dateISOToDisplay(initialData.data_carta_transferencia) : '',
      denominacao_origem: initialData?.denominacao_origem ?? '',
    },
  })

  const maritalStatus = watch('marital_status')
  const recebeuCarta = watch('recebeu_carta_transferencia')

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form
      onSubmit={handleSubmit(async (raw) => {
        const data: MemberFormData = {
          full_name: raw.full_name,
          birth_date: raw.birth_date ? (dateDisplayToISO(raw.birth_date) ?? null) : null,
          baptism_date: raw.baptism_date ? (dateDisplayToISO(raw.baptism_date) ?? null) : null,
          holy_spirit_date: raw.holy_spirit_date ? (dateDisplayToISO(raw.holy_spirit_date) ?? null) : null,
          father_name: raw.father_name || null,
          mother_name: raw.mother_name || null,
          naturalidade: raw.naturalidade || null,
          naturalidade_uf: raw.naturalidade_uf ? raw.naturalidade_uf.toUpperCase() : null,
          cpf: raw.cpf ? raw.cpf.replace(/\D/g, '') : null,
          rg: raw.rg ? raw.rg.replace(/\D/g, '') : null,
          phone: raw.phone ? raw.phone.replace(/\D/g, '') : null,
          phone_secondary: raw.phone_secondary ? raw.phone_secondary.replace(/\D/g, '') : null,
          email: raw.email || null,
          address_street: raw.address_street || null,
          address_number: raw.address_number || null,
          address_complement: raw.address_complement || null,
          address_neighborhood: raw.address_neighborhood || null,
          address_city: raw.address_city || null,
          address_state: raw.address_state || null,
          address_zip: raw.address_zip ? raw.address_zip.replace(/\D/g, '') : null,
          marital_status: raw.marital_status ?? null,
          spouse_name: raw.spouse_name || null,
          occupation: raw.occupation || null,
          congregation_id: raw.congregation_id,
          status: raw.status,
          church_role: raw.church_role || null,
          ministry: raw.ministry || null,
          ministries: raw.ministries ?? [],
          is_congregation_leader: raw.is_congregation_leader ?? false,
          notes: raw.notes || null,
          joined_at: raw.joined_at ? (dateDisplayToISO(raw.joined_at) ?? null) : null,
          escolaridade: raw.escolaridade || null,
          titulo_eleitor: raw.titulo_eleitor || null,
          zona_eleitoral: raw.zona_eleitoral || null,
          secao_eleitoral: raw.secao_eleitoral || null,
          batismo_pastor: raw.batismo_pastor || null,
          batismo_local: raw.batismo_local || null,
          recebeu_carta_transferencia: raw.recebeu_carta_transferencia ?? false,
          data_carta_transferencia: raw.data_carta_transferencia ? (dateDisplayToISO(raw.data_carta_transferencia) ?? null) : null,
          denominacao_origem: raw.denominacao_origem || null,
        }
        await onSave(data, photoFile)
      })}
      className="flex flex-col gap-5"
    >
      {/* Nota de obrigatórios */}
      <p className="text-xs text-slate-500">
        Campos marcados com <span className="text-red-500 font-semibold">*</span> são obrigatórios.
      </p>

      {/* Foto */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar
            src={photoPreview ?? undefined}
            name={watch('full_name') || 'M'}
            size="xl"
          />
          {photoPreview && (
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Camera size={13} />
          {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Dados Pessoais */}
      <Section title="Dados Pessoais">
        <Input
          label="Nome Completo"
          placeholder="Nome completo do membro"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="birth_date"
            control={control}
            render={({ field }) => (
              <Input
                label="Data de Nascimento"
                placeholder="dd/mm/aaaa"
                error={errors.birth_date?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskDate(e.target.value))}
              />
            )}
          />
          <Controller
            name="joined_at"
            control={control}
            render={({ field }) => (
              <Input
                label="Data de Ingresso"
                placeholder="dd/mm/aaaa"
                error={errors.joined_at?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskDate(e.target.value))}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome do Pai"
            placeholder="Nome do pai"
            error={errors.father_name?.message}
            {...register('father_name')}
          />
          <Input
            label="Nome da Mãe"
            placeholder="Nome da mãe"
            error={errors.mother_name?.message}
            {...register('mother_name')}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Naturalidade (cidade de nascimento)"
              placeholder="Ex: Iaçu"
              error={errors.naturalidade?.message}
              {...register('naturalidade')}
            />
          </div>
          <Input
            label="UF"
            placeholder="BA"
            maxLength={2}
            error={errors.naturalidade_uf?.message}
            {...register('naturalidade_uf')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Estado Civil"
            error={errors.marital_status?.message}
            {...register('marital_status')}
          >
            <option value="">Selecione...</option>
            <option value="solteiro">Solteiro(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viuvo">Viúvo(a)</option>
            <option value="separado">Separado(a)</option>
          </SelectField>
          {(maritalStatus === 'casado') && (
            <Input
              label="Cônjuge"
              placeholder="Nome do cônjuge"
              error={errors.spouse_name?.message}
              {...register('spouse_name')}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Profissão"
            placeholder="Ex: Agricultor, Professora..."
            error={errors.occupation?.message}
            {...register('occupation')}
          />
          <SelectField
            label="Escolaridade"
            error={errors.escolaridade?.message}
            {...register('escolaridade')}
          >
            <option value="">Não informada</option>
            {ESCOLARIDADES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </SelectField>
        </div>
      </Section>

      {/* Documentos */}
      <Section title="Documentos">
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskCPF(e.target.value))}
              />
            )}
          />
          <Input
            label="RG"
            placeholder="0000000"
            error={errors.rg?.message}
            {...register('rg')}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Input
              label="Título de Eleitor"
              placeholder="0000 0000 0000"
              error={errors.titulo_eleitor?.message}
              {...register('titulo_eleitor')}
            />
          </div>
          <Input
            label="Zona"
            placeholder="000"
            error={errors.zona_eleitoral?.message}
            {...register('zona_eleitoral')}
          />
          <Input
            label="Seção"
            placeholder="0000"
            error={errors.secao_eleitoral?.message}
            {...register('secao_eleitoral')}
          />
        </div>
      </Section>

      {/* Contato */}
      <Section title="Contato">
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                label="Telefone / WhatsApp"
                type="tel"
                placeholder="(75) 99999-9999"
                error={errors.phone?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
              />
            )}
          />
          <Controller
            name="phone_secondary"
            control={control}
            render={({ field }) => (
              <Input
                label="Telefone Secundário"
                type="tel"
                placeholder="(75) 99999-9999"
                error={errors.phone_secondary?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
              />
            )}
          />
        </div>
        <Input
          label="E-mail"
          type="email"
          placeholder="email@exemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </Section>

      {/* Endereço */}
      <Section title="Endereço">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Rua / Avenida"
              placeholder="Ex: Rua das Flores"
              error={errors.address_street?.message}
              {...register('address_street')}
            />
          </div>
          <Input
            label="Número"
            placeholder="123"
            error={errors.address_number?.message}
            {...register('address_number')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Bairro"
            placeholder="Centro"
            error={errors.address_neighborhood?.message}
            {...register('address_neighborhood')}
          />
          <Input
            label="Complemento"
            placeholder="Apto, Sala..."
            error={errors.address_complement?.message}
            {...register('address_complement')}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Cidade"
              placeholder="Iaçu"
              error={errors.address_city?.message}
              {...register('address_city')}
            />
          </div>
          <Input
            label="Estado"
            placeholder="BA"
            maxLength={2}
            error={errors.address_state?.message}
            {...register('address_state')}
          />
        </div>
        <Controller
          name="address_zip"
          control={control}
          render={({ field }) => (
            <Input
              label="CEP"
              placeholder="44000-000"
              error={errors.address_zip?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(maskCEP(e.target.value))}
            />
          )}
        />
      </Section>

      {/* Igreja */}
      <Section title="Igreja">
        <SelectField
          label="Congregação"
          required
          error={errors.congregation_id?.message}
          {...register('congregation_id')}
        >
          <option value="">Selecione a congregação...</option>
          {congregations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.is_headquarters ? ' (Sede)' : ''}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Status"
            required
            error={errors.status?.message}
            {...register('status')}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="em_experiencia">Em Experiência</option>
            <option value="transferido">Transferido</option>
            <option value="falecido">Falecido</option>
            <option value="excluido">Excluído</option>
          </SelectField>

          <SelectField
            label="Cargo na Igreja"
            error={errors.church_role?.message}
            {...register('church_role')}
          >
            <option value="">Selecione...</option>
            {CHURCH_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </SelectField>
        </div>

        {/* Multi-select de Ministérios */}
        <Controller
          name="ministries"
          control={control}
          render={({ field }) => {
            const selected: string[] = field.value ?? []
            const toggle = (m: string) => {
              const next = selected.includes(m)
                ? selected.filter((s) => s !== m)
                : [...selected, m]
              field.onChange(next)
            }
            return (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Ministérios</label>
                <div className="flex flex-wrap gap-1.5">
                  {MINISTRIES.map((m) => {
                    const active = selected.includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggle(m)}
                        className={[
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          active
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400',
                        ].join(' ')}
                      >
                        {active && <Check size={10} />}
                        {m}
                      </button>
                    )
                  })}
                </div>
                {selected.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum ministério selecionado</p>
                )}
              </div>
            )
          }}
        />

        {/* Dirigente de congregação — visível apenas para liderança/admin */}
        {canDeleteMembers && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
              {...register('is_congregation_leader')}
            />
            <span>Este membro é <strong>dirigente de congregação</strong></span>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="baptism_date"
            control={control}
            render={({ field }) => (
              <Input
                label="Data de Batismo em Águas"
                placeholder="dd/mm/aaaa"
                error={errors.baptism_date?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskDate(e.target.value))}
              />
            )}
          />
          <Controller
            name="holy_spirit_date"
            control={control}
            render={({ field }) => (
              <Input
                label="Data do Batismo no Espírito"
                placeholder="dd/mm/aaaa"
                error={errors.holy_spirit_date?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskDate(e.target.value))}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Pastor que efetuou o batismo"
            placeholder="Nome do pastor"
            error={errors.batismo_pastor?.message}
            {...register('batismo_pastor')}
          />
          <Input
            label="Local do batismo"
            placeholder="Ex: Rio Paraguaçu"
            error={errors.batismo_local?.message}
            {...register('batismo_local')}
          />
        </div>
      </Section>

      {/* Transferência / Denominação */}
      <Section title="Transferência">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            {...register('recebeu_carta_transferencia')}
          />
          Recebeu carta de transferência de outra igreja
        </label>
        {recebeuCarta && (
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="data_carta_transferencia"
              control={control}
              render={({ field }) => (
                <Input
                  label="Data de recebimento da carta"
                  placeholder="dd/mm/aaaa"
                  error={errors.data_carta_transferencia?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(maskDate(e.target.value))}
                />
              )}
            />
            <Input
              label="Denominação de origem"
              placeholder="Ex: Assembleia de Deus"
              error={errors.denominacao_origem?.message}
              {...register('denominacao_origem')}
            />
          </div>
        )}
        {!recebeuCarta && (
          <Input
            label="Denominação de origem (se veio de outra igreja)"
            placeholder="Ex: Igreja Batista, Presbiteriana..."
            error={errors.denominacao_origem?.message}
            {...register('denominacao_origem')}
          />
        )}
      </Section>

      {/* Observações */}
      <Section title="Observações">
        <TextArea
          label="Notas internas"
          placeholder="Anotações sobre o membro (não visível ao membro)..."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </Section>

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {initialData ? 'Salvar alterações' : 'Cadastrar membro'}
        </Button>
      </div>
    </form>
  )
}
