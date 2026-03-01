import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ============================================================
// ResetPasswordPage — Define nova senha após convite ou reset
//
// O Supabase envia links com hash fragment:
//   /auth/reset-password#access_token=...&type=invite
//   /auth/reset-password#access_token=...&type=recovery
//
// O SDK JS do Supabase processa o hash automaticamente via
// onAuthStateChange: convite → evento SIGNED_IN,
//                   reset   → evento PASSWORD_RECOVERY
// ============================================================

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Use pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Use pelo menos um número'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

// Lê o tipo do token diretamente do hash da URL
function getTokenType(): string | null {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  return params.get('type') // 'invite' | 'recovery' | null
}

type PageState = 'loading' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pageState, setPageState] = useState<PageState>('loading')

  useEffect(() => {
    // Verifica se há um token válido no hash da URL
    const tokenType = getTokenType()

    if (tokenType === 'invite' || tokenType === 'recovery') {
      // Token presente — aguarda o Supabase processar e disparar o evento
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          // Sessão criada a partir do link — estamos prontos para redefinir
          setPageState('ready')
        }
      })
      return () => subscription.unsubscribe()
    }

    // Sem token no hash — verifica se já há uma sessão de recovery ativa
    // (caso o usuário recarregue a página)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setPageState('ready')
      } else {
        setPageState('invalid')
      }
    })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError('Erro ao salvar a senha. Tente solicitar um novo link.')
    } else {
      setSuccess(true)
      // Aguarda 2s mostrando sucesso, depois vai para o dashboard
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
    }
  }

  // ---- Estados de UI ----

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="IADI" className="w-16 h-16 rounded-full animate-pulse" />
          <p className="text-white text-sm">Verificando link…</p>
        </div>
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Link inválido ou expirado</h2>
          <p className="text-sm text-slate-600 mb-6">
            Este link já foi utilizado ou expirou.
            Solicite um novo convite ao administrador do sistema.
          </p>
          <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
            Voltar ao login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/logo.png"
              alt="IADI"
              className="w-16 h-16 rounded-full object-cover mb-3 shadow-md"
            />
            <h1 className="text-xl font-bold text-blue-900 text-center">Definir sua senha</h1>
            <p className="text-sm text-slate-500 text-center mt-1">Igreja Assembleia de Deus em Iaçu — Gestão de Membros</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={48} className="text-green-500" />
              <p className="font-semibold text-slate-800">Senha definida com sucesso!</p>
              <p className="text-sm text-slate-500">Entrando no sistema…</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 text-center mb-5">
                Escolha uma senha segura para acessar o sistema.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Nova senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  leftAddon={<Lock size={15} />}
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  error={errors.password?.message}
                  hint="Mínimo 8 caracteres, 1 maiúscula e 1 número"
                  {...register('password')}
                />

                <Input
                  label="Confirmar senha"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  leftAddon={<Lock size={15} />}
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  error={errors.confirm?.message}
                  {...register('confirm')}
                />

                {serverError && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                    <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{serverError}</p>
                  </div>
                )}

                <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full mt-1">
                  Salvar senha e entrar
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-blue-300 mt-4">
          IADI © {new Date().getFullYear()} — Sistema restrito à liderança
        </p>
      </div>
    </div>
  )
}
