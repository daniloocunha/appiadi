import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitPublicRegistration } from '@/hooks/useSelfRegistrations'
import { uploadRegistrationPhoto } from '@/utils/photoUpload'
import { CHURCH_ROLES, MINISTRIES, ESCOLARIDADES } from '@/schemas/member.schema'
import { maskCPF, maskPhone, maskCEP } from '@/utils/inputMasks'
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react'

// Schema simplificado para o formulário público
const publicSchema = z.object({
  full_name:            z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  birth_date:           z.string().optional(),
  phone:                z.string().optional(),
  email:                z.string().email('E-mail inválido').optional().or(z.literal('')),
  cpf:                  z.string().optional(),
  rg:                   z.string().optional(),
  father_name:          z.string().optional(),
  mother_name:          z.string().optional(),
  address_street:       z.string().optional(),
  address_number:       z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city:         z.string().optional(),
  address_state:        z.string().optional(),
  address_zip:          z.string().optional(),
  marital_status:       z.enum(['solteiro','casado','divorciado','viuvo','separado']).optional(),
  spouse_name:          z.string().optional(),
  occupation:           z.string().optional(),
  escolaridade:         z.string().optional(),
  church_role:          z.string().optional(),
  ministry:             z.string().optional(),
  titulo_eleitor:       z.string().optional(),
  zona_eleitoral:       z.string().optional(),
  secao_eleitoral:      z.string().optional(),
  // Batismo
  batizado_aguas:       z.boolean().optional(),
  baptism_date:         z.string().optional(),
  batismo_pastor:       z.string().optional(),
  batismo_local:        z.string().optional(),
  batizado_espirito:    z.boolean().optional(),
  holy_spirit_date:     z.string().optional(),
})

type PublicFormInput = z.infer<typeof publicSchema>

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClass =
  'h-9 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectClass =
  'h-9 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

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

export function PublicRegistrationPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<PublicFormInput>({ resolver: zodResolver(publicSchema) })

  const maritalStatus = watch('marital_status')
  const batizadoAguas = watch('batizado_aguas')
  const batizadoEspirito = watch('batizado_espirito')

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-800 mb-1">Link inválido</h2>
          <p className="text-sm text-slate-500">
            Este link de cadastro é inválido ou está incompleto. Solicite um novo link à sua congregação.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Cadastro enviado!</h2>
          <p className="text-sm text-slate-500">
            Seus dados foram enviados com sucesso. Aguarde a aprovação da liderança da sua congregação.
            Você será notificado em breve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-5 text-center">
        <img src="/logo.png" alt="IADI" className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
        <h1 className="text-base font-bold">Igreja Assembleia de Deus</h1>
        <p className="text-xs text-blue-200">Iaçu — BA</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-4">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Formulário de Cadastro</h2>
          <p className="text-xs text-slate-500">
            Preencha seus dados para ser cadastrado como membro. Todos os campos marcados com{' '}
            <span className="text-red-500">*</span> são obrigatórios.
          </p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async (raw) => {
            setIsSubmitting(true)
            setSubmitError(null)

            try {
              let photo_url: string | null = null

              if (photoFile) {
                const tempId = Date.now().toString()
                const result = await uploadRegistrationPhoto(photoFile, tempId)
                if (result.url) photo_url = result.url
              }

              const { error } = await submitPublicRegistration({
                token,
                full_name: raw.full_name,
                birth_date: raw.birth_date || null,
                phone: raw.phone ? raw.phone.replace(/\D/g, '') : null,
                email: raw.email || null,
                cpf: raw.cpf ? raw.cpf.replace(/\D/g, '') : null,
                rg: raw.rg || null,
                father_name: raw.father_name || null,
                mother_name: raw.mother_name || null,
                address_street: raw.address_street || null,
                address_number: raw.address_number || null,
                address_neighborhood: raw.address_neighborhood || null,
                address_city: raw.address_city || null,
                address_state: raw.address_state || null,
                address_zip: raw.address_zip ? raw.address_zip.replace(/\D/g, '') : null,
                marital_status: raw.marital_status || null,
                spouse_name: raw.spouse_name || null,
                occupation: raw.occupation || null,
                church_role: raw.church_role || null,
                ministry: raw.ministry || null,
                photo_url,
                escolaridade: raw.escolaridade || null,
                titulo_eleitor: raw.titulo_eleitor || null,
                zona_eleitoral: raw.zona_eleitoral || null,
                secao_eleitoral: raw.secao_eleitoral || null,
                baptism_date: raw.batizado_aguas ? (raw.baptism_date || null) : null,
                holy_spirit_date: raw.batizado_espirito ? (raw.holy_spirit_date || null) : null,
                batismo_pastor: raw.batizado_aguas ? (raw.batismo_pastor || null) : null,
                batismo_local: raw.batizado_aguas ? (raw.batismo_local || null) : null,
              })

              if (error) {
                setSubmitError(`Erro ao enviar: ${error}. Tente novamente.`)
              } else {
                setSubmitted(true)
              }
            } catch {
              setSubmitError('Erro inesperado. Verifique sua conexão e tente novamente.')
            } finally {
              setIsSubmitting(false)
            }
          })}
        >
          {/* Foto */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col items-center gap-3">
            <div className="relative">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Prévia"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <Camera size={24} className="text-slate-400" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 font-medium"
            >
              {photoPreview ? 'Trocar foto' : 'Adicionar foto (opcional)'}
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
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Dados Pessoais">
              <Field label="Nome Completo" required error={errors.full_name?.message}>
                <input className={inputClass} placeholder="Seu nome completo" {...register('full_name')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data de Nascimento" error={errors.birth_date?.message}>
                  <input type="date" className={inputClass} {...register('birth_date')} />
                </Field>
                <Field label="Estado Civil" error={errors.marital_status?.message}>
                  <select className={selectClass} {...register('marital_status')}>
                    <option value="">Selecione...</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                    <option value="separado">Separado(a)</option>
                  </select>
                </Field>
              </div>

              {maritalStatus === 'casado' && (
                <Field label="Nome do Cônjuge">
                  <input className={inputClass} placeholder="Nome do cônjuge" {...register('spouse_name')} />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome do Pai">
                  <input className={inputClass} placeholder="Nome do pai" {...register('father_name')} />
                </Field>
                <Field label="Nome da Mãe">
                  <input className={inputClass} placeholder="Nome da mãe" {...register('mother_name')} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Profissão">
                  <input className={inputClass} placeholder="Ex: Agricultora..." {...register('occupation')} />
                </Field>
                <Field label="Escolaridade">
                  <select className={selectClass} {...register('escolaridade')}>
                    <option value="">Não informada</option>
                    {ESCOLARIDADES.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Documentos">
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF">
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <input
                        className={inputClass}
                        placeholder="000.000.000-00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      />
                    )}
                  />
                </Field>
                <Field label="RG">
                  <input className={inputClass} placeholder="0000000" {...register('rg')} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label="Título de Eleitor">
                    <input className={inputClass} placeholder="0000 0000 0000" {...register('titulo_eleitor')} />
                  </Field>
                </div>
                <Field label="Zona">
                  <input className={inputClass} placeholder="000" {...register('zona_eleitoral')} />
                </Field>
                <Field label="Seção">
                  <input className={inputClass} placeholder="0000" {...register('secao_eleitoral')} />
                </Field>
              </div>
            </Section>
          </div>

          {/* Contato */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Contato">
              <Field label="Telefone / WhatsApp">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="(75) 99999-9999"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    />
                  )}
                />
              </Field>
              <Field label="E-mail" error={errors.email?.message}>
                <input type="email" className={inputClass} placeholder="email@exemplo.com" {...register('email')} />
              </Field>
            </Section>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Endereço">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Rua / Avenida">
                    <input className={inputClass} placeholder="Rua das Flores" {...register('address_street')} />
                  </Field>
                </div>
                <Field label="Número">
                  <input className={inputClass} placeholder="123" {...register('address_number')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bairro">
                  <input className={inputClass} placeholder="Centro" {...register('address_neighborhood')} />
                </Field>
                <Field label="Cidade">
                  <input className={inputClass} placeholder="Iaçu" {...register('address_city')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado">
                  <input className={inputClass} placeholder="BA" maxLength={2} {...register('address_state')} />
                </Field>
                <Field label="CEP">
                  <Controller
                    name="address_zip"
                    control={control}
                    render={({ field }) => (
                      <input
                        className={inputClass}
                        placeholder="44000-000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(maskCEP(e.target.value))}
                      />
                    )}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Batismo */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Batismo">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  {...register('batizado_aguas')}
                />
                Sou batizado(a) nas águas
              </label>

              {batizadoAguas && (
                <div className="pl-1 flex flex-col gap-3 border-l-2 border-blue-100 ml-1">
                  <Field label="Data do batismo em águas">
                    <input type="date" className={inputClass} {...register('baptism_date')} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Pastor que efetuou o batismo">
                      <input className={inputClass} placeholder="Nome do pastor" {...register('batismo_pastor')} />
                    </Field>
                    <Field label="Local do batismo">
                      <input className={inputClass} placeholder="Ex: Rio Paraguaçu" {...register('batismo_local')} />
                    </Field>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 mt-1">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  {...register('batizado_espirito')}
                />
                Recebi o batismo no Espírito Santo
              </label>

              {batizadoEspirito && (
                <div className="pl-1 border-l-2 border-blue-100 ml-1">
                  <Field label="Data do batismo no Espírito Santo">
                    <input type="date" className={inputClass} {...register('holy_spirit_date')} />
                  </Field>
                </div>
              )}
            </Section>
          </div>

          {/* Igreja */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
            <Section title="Informações da Igreja">
              <Field label="Cargo na Igreja">
                <select className={selectClass} {...register('church_role')}>
                  <option value="">Selecione...</option>
                  {CHURCH_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ministério">
                <select className={selectClass} {...register('ministry')}>
                  <option value="">Nenhum</option>
                  {MINISTRIES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </Section>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              'h-12 w-full rounded-xl text-white font-semibold text-sm transition-colors',
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800 active:bg-blue-950',
            ].join(' ')}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Cadastro'}
          </button>

          <p className="text-xs text-slate-400 text-center pb-6">
            Seus dados serão revisados pela liderança antes de serem confirmados.
          </p>
        </form>
      </div>
    </div>
  )
}
