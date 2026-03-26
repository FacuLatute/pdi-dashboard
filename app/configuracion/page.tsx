'use client'

import { useEffect, useState } from 'react'

interface Proyecto {
  nombre: string
  materia: string
  cierre: string
  ultima_actualizacion: string
}

function toInputDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  if (!dd || !mm || !yyyy) return ''
  return `${yyyy}-${mm}-${dd}`
}

function fromInputDate(yyyymmdd: string): string {
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  if (!yyyy || !mm || !dd) return ''
  return `${dd}/${mm}/${yyyy}`
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ConfiguracionPage() {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [form, setForm] = useState({ nombre: '', materia: '', cierre: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [premisaForm, setPremisaForm] = useState({ titulo: '', estado: 'pendiente' })
  const [submitting, setSubmitting] = useState(false)
  const [premisaMsg, setPremisaMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data: Proyecto) => {
        setProyecto(data)
        setForm({
          nombre: data.nombre,
          materia: data.materia,
          cierre: toInputDate(data.cierre),
        })
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        materia: form.materia,
        cierre: fromInputDate(form.cierre),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddPremisa(e: React.FormEvent) {
    e.preventDefault()
    if (!premisaForm.titulo.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/premisas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: premisaForm.titulo.trim(), estado: premisaForm.estado }),
    })
    setSubmitting(false)
    if (res.ok) {
      setPremisaForm({ titulo: '', estado: 'pendiente' })
      setPremisaMsg({ text: 'Premisa agregada con éxito.', ok: true })
    } else {
      setPremisaMsg({ text: 'Error al agregar la premisa.', ok: false })
    }
    setTimeout(() => setPremisaMsg(null), 3000)
  }

  if (!proyecto) return <p className="text-sm text-zinc-400">Cargando...</p>

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-500">Ajustes del proyecto PDI.</p>
      </div>

      {/* Section 1: Project metadata */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">Datos del proyecto</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 outline-none focus:border-[#534AB7] text-zinc-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Materia</label>
            <input
              type="text"
              value={form.materia}
              onChange={(e) => setForm((f) => ({ ...f, materia: e.target.value }))}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 outline-none focus:border-[#534AB7] text-zinc-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Cierre</label>
            <input
              type="date"
              value={form.cierre}
              onChange={(e) => setForm((f) => ({ ...f, cierre: e.target.value }))}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 outline-none focus:border-[#534AB7] text-zinc-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Última actualización</label>
            <input
              type="text"
              value={todayISO()}
              readOnly
              className="w-full text-sm border border-zinc-100 rounded px-3 py-2 bg-zinc-50 text-zinc-400 cursor-default select-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-medium px-4 py-2 rounded bg-[#534AB7] text-white hover:bg-[#4640a3] transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Guardado</span>}
        </div>
      </section>

      {/* Section 2: Add premisa */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">Agregar premisa</h2>

        <form onSubmit={handleAddPremisa} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Título</label>
            <input
              type="text"
              value={premisaForm.titulo}
              onChange={(e) => setPremisaForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Nombre de la premisa"
              required
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 outline-none focus:border-[#534AB7] text-zinc-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Estado inicial</label>
            <select
              value={premisaForm.estado}
              onChange={(e) => setPremisaForm((f) => ({ ...f, estado: e.target.value }))}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 outline-none focus:border-[#534AB7] text-zinc-800 bg-white"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completa">Completa</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-medium px-4 py-2 rounded bg-[#534AB7] text-white hover:bg-[#4640a3] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Agregando...' : 'Agregar premisa'}
            </button>
            {premisaMsg && (
              <span className={`text-xs font-medium ${premisaMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {premisaMsg.text}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
