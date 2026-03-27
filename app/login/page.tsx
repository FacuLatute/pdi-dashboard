'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_PREMISAS = [
  'Condición general del negocio',
  'Aspectos legales — SRL',
  'Aspectos contables y administrativos',
  'Recursos humanos — CCT 130/75',
  'Compras y proveedores',
  'Ventas y política de precios',
  'Estudio de mercado',
  'Estrategia comercial — 4P',
  'Presupuesto integral 12 meses',
  'Estados contables proyectados',
  'Análisis financiero (VAN, TIR, etc.)',
  'Manual de empresa',
  'Habilitaciones e inscripciones',
  'Plan de cuentas — Regisoft',
  'Otros / adicionales',
]

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function seedNewUser(userId: string, email: string) {
  const supabase = createClient()

  // 1. Insert profile
  await supabase.from('profiles').insert({ id: userId, email })

  // 2. Insert default proyecto
  const { data: proyecto, error: proyectoError } = await supabase
    .from('proyectos')
    .insert({
      user_id: userId,
      nombre: 'AgroEnergía SRL',
      materia: 'PDI 1',
      cierre: '31/07/2026',
      ultima_actualizacion: todayISO(),
    })
    .select('id')
    .single()

  if (proyectoError || !proyecto) {
    console.error('Error creating proyecto:', proyectoError)
    return
  }

  // 3. Insert 15 default premisas
  const premisas = DEFAULT_PREMISAS.map((titulo, i) => ({
    proyecto_id: proyecto.id,
    numero: i + 1,
    titulo,
    estado: 'pendiente',
    pagina: null,
    notas: '',
    archivos_vinculados: [],
  }))

  await supabase.from('premisas').insert(premisas)
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/premisas')
      router.refresh()
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        // Email confirmation disabled — user is immediately active
        await seedNewUser(data.user!.id, email)
        router.push('/premisas')
        router.refresh()
      } else {
        // Email confirmation required
        setMessage('Revisá tu email para confirmar tu cuenta.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">PDI</p>
          <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800 mb-6">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/20 text-zinc-800 transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Contraseña</label>
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/20 text-zinc-800 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {message && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#534AB7] text-white text-sm font-medium hover:bg-[#4640a3] transition-colors disabled:opacity-60 mt-2"
            >
              {loading
                ? mode === 'login'
                  ? 'Ingresando...'
                  : 'Registrando...'
                : mode === 'login'
                  ? 'Ingresar'
                  : 'Registrarse'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-zinc-100 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-zinc-500">
                ¿No tenés cuenta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                  className="text-[#534AB7] font-medium hover:underline"
                >
                  Registrarse
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setMessage(null) }}
                  className="text-[#534AB7] font-medium hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
