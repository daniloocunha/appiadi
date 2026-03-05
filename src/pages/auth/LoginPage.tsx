import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('E-mail ou senha incorretos. Verifique e tente novamente.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo e título */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/logo.png"
              alt="IADI"
              className="w-36 h-36 object-contain mb-3"
            />
            <p className="text-sm text-slate-500 text-center">Gestão de Membros</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              leftAddon={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftAddon={<Lock size={15} />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full mt-1">
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-amber-600 hover:text-amber-800 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-amber-300 mt-4">
          IADI © {new Date().getFullYear()} — Sistema restrito à liderança
        </p>
      </div>
    </div>
  )
}
