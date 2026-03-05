import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    await resetPassword(data.email)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft size={15} /> Voltar ao login
        </Link>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={48} className="text-green-500" />
            <h2 className="text-lg font-semibold text-slate-800">E-mail enviado!</h2>
            <p className="text-sm text-slate-600 text-center">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <Link to="/login">
              <Button variant="secondary" size="sm">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-amber-900 mb-1">Redefinir senha</h2>
            <p className="text-sm text-slate-600 mb-6">
              Informe seu e-mail e enviaremos um link para redefinição de senha.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                leftAddon={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Enviar link de redefinição
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
