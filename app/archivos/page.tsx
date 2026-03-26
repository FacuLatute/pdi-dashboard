'use client'

import { useEffect, useRef, useState } from 'react'

type Tipo = 'html' | 'docx' | 'xlsx'
type Estado = 'completo' | 'en_progreso'
type EditableField = 'nombre' | 'version' | 'seccion' | 'notas'

interface VersionEntry {
  version: string
  filename: string
  fecha: string
  ruta: string
}

interface Archivo {
  id: number
  nombre: string
  tipo: Tipo
  version: string
  estado: Estado
  seccion: string
  notas: string
  ruta: string
  historial: VersionEntry[]
}

const TIPO_STYLE: Record<string, string> = {
  html: 'bg-blue-100 text-blue-700',
  docx: 'bg-violet-100 text-violet-700',
  xlsx: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = {
  nombre: '',
  tipo: 'docx' as Tipo,
  version: 'v1',
  seccion: '',
  estado: 'en_progreso' as Estado,
}

function todayDMY(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function nextVersion(version: string): string {
  const num = parseInt(version.replace(/^v/i, ''), 10)
  return isNaN(num) ? 'v2' : `v${num + 1}`
}

export default function ArchivosPage() {
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id: number; field: EditableField } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [expandedHistorial, setExpandedHistorial] = useState<Set<number>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  const firstFormRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/archivos')
      .then((r) => r.json())
      .then((data: Archivo[]) => {
        setArchivos(data.map((a) => ({ ...a, historial: a.historial ?? [] })))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (showForm) firstFormRef.current?.focus()
  }, [showForm])

  async function patch(id: number, fields: Partial<Omit<Archivo, 'id'>>) {
    setArchivos((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)))
    await fetch('/api/archivos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    })
  }

  function startEdit(id: number, field: EditableField, current: string) {
    setEditing({ id, field })
    setEditValue(current)
  }

  function commitEdit() {
    if (!editing) return
    const { id, field } = editing
    setEditing(null)
    patch(id, { [field]: editValue })
  }

  function cancelEdit() {
    setEditing(null)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.seccion.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/archivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, notas: '' }),
    })
    const created: Archivo = await res.json()
    setArchivos((prev) => [...prev, { ...created, historial: created.historial ?? [] }])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSubmitting(false)
  }

  function handleUploadClick(id: number) {
    setUploadingId(id)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const id = uploadingId
    e.target.value = ''

    if (!file || id === null) {
      setUploadingId(null)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const { filename } = await res.json()

      const archivo = archivos.find((a) => a.id === id)
      if (!archivo) return

      const updates: Partial<Omit<Archivo, 'id'>> = { ruta: filename }

      if (archivo.ruta) {
        const prevEntry: VersionEntry = {
          version: archivo.version,
          filename: archivo.ruta,
          fecha: todayDMY(),
          ruta: archivo.ruta,
        }
        updates.historial = [...(archivo.historial ?? []), prevEntry]
        updates.version = nextVersion(archivo.version)
      }

      await patch(id, updates)
    } finally {
      setUploadingId(null)
    }
  }

  async function restoreVersion(id: number, entry: VersionEntry, archivo: Archivo) {
    let newHistorial = archivo.historial.filter(
      (h) => !(h.version === entry.version && h.ruta === entry.ruta)
    )
    if (archivo.ruta) {
      newHistorial = [
        ...newHistorial,
        {
          version: archivo.version,
          filename: archivo.ruta,
          fecha: todayDMY(),
          ruta: archivo.ruta,
        },
      ]
    }
    await patch(id, {
      version: entry.version,
      ruta: entry.ruta,
      historial: newHistorial,
    })
  }

  function toggleHistorial(id: number) {
    setExpandedHistorial((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <p className="text-sm text-zinc-400">Cargando...</p>

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Hidden file input — shared across all cards */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {archivos.length} archivo{archivos.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
            showForm
              ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              : 'bg-[#534AB7] text-white hover:bg-[#4840a0]'
          }`}
        >
          {showForm ? 'Cancelar' : '+ Agregar archivo'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={submitForm}
          className="rounded-lg border border-[#534AB7]/25 bg-[#534AB7]/5 p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-[#534AB7] uppercase tracking-wider">
            Nuevo archivo
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Nombre</label>
              <input
                ref={firstFormRef}
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                required
                placeholder="Ej. Presupuesto integral"
                className="w-full text-sm border border-zinc-200 rounded px-3 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-800 placeholder:text-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Tipo }))}
                className="w-full text-sm border border-zinc-200 rounded px-3 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-800"
              >
                <option value="html">HTML</option>
                <option value="docx">DOCX</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Versión</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="v1"
                className="w-full text-sm border border-zinc-200 rounded px-3 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-800 placeholder:text-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Sección PDI</label>
              <input
                type="text"
                value={form.seccion}
                onChange={(e) => setForm((f) => ({ ...f, seccion: e.target.value }))}
                required
                placeholder="Ej. Estudio de mercado"
                className="w-full text-sm border border-zinc-200 rounded px-3 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-800 placeholder:text-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as Estado }))}
                className="w-full text-sm border border-zinc-200 rounded px-3 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-800"
              >
                <option value="completo">Completo</option>
                <option value="en_progreso">En progreso</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-medium px-4 py-1.5 rounded bg-[#534AB7] text-white hover:bg-[#4840a0] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {/* Card grid */}
      {archivos.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">
          No hay archivos. Agregá uno arriba.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {archivos.map((archivo) => {
            const isEditing = (field: EditableField) =>
              editing?.id === archivo.id && editing.field === field
            const isUploading = uploadingId === archivo.id
            const historialOpen = expandedHistorial.has(archivo.id)
            const hasHistory = Boolean(archivo.ruta) || archivo.historial.length > 0

            return (
              <div
                key={archivo.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                {/* Top: type badge + status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      TIPO_STYLE[archivo.tipo] ?? 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {archivo.tipo}
                  </span>
                  <button
                    onClick={() =>
                      patch(archivo.id, {
                        estado: archivo.estado === 'completo' ? 'en_progreso' : 'completo',
                      })
                    }
                    title={
                      archivo.estado === 'completo'
                        ? 'Completo — clic para cambiar'
                        : 'En progreso — clic para cambiar'
                    }
                    className="flex items-center gap-1.5 group"
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        archivo.estado === 'completo' ? 'bg-green-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-700 transition-colors">
                      {archivo.estado === 'completo' ? 'Completo' : 'En progreso'}
                    </span>
                  </button>
                </div>

                {/* File name */}
                {isEditing('nombre') ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="text-sm font-semibold border border-[#534AB7] rounded px-2 py-0.5 outline-none text-zinc-800 w-full"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(archivo.id, 'nombre', archivo.nombre)}
                    title="Clic para editar nombre"
                    className="text-sm font-semibold text-zinc-800 hover:text-[#534AB7] text-left transition-colors leading-snug"
                  >
                    {archivo.nombre}
                  </button>
                )}

                {/* Version · Section */}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {isEditing('version') ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-16 text-xs border border-[#534AB7] rounded px-1.5 py-0.5 outline-none text-zinc-800 font-mono shrink-0"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(archivo.id, 'version', archivo.version)}
                      title="Clic para editar versión"
                      className="font-mono bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 transition-colors shrink-0"
                    >
                      {archivo.version}
                    </button>
                  )}

                  <span className="text-zinc-300 select-none">·</span>

                  {isEditing('seccion') ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="flex-1 min-w-0 text-xs border border-[#534AB7] rounded px-1.5 py-0.5 outline-none text-zinc-800"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(archivo.id, 'seccion', archivo.seccion)}
                      title="Clic para editar sección"
                      className="flex-1 min-w-0 text-left truncate hover:text-zinc-800 transition-colors"
                    >
                      {archivo.seccion}
                    </button>
                  )}
                </div>

                {/* Ver historial link */}
                {hasHistory && (
                  <button
                    onClick={() => toggleHistorial(archivo.id)}
                    className="text-xs text-[#534AB7] hover:underline text-left -mt-1"
                  >
                    {historialOpen ? 'Ocultar historial' : 'Ver historial'}
                  </button>
                )}

                {/* Version history panel */}
                {historialOpen && (
                  <div className="rounded-md bg-zinc-50 border border-zinc-100 p-3 space-y-2 -mt-1">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Historial de versiones
                    </p>
                    <ul className="space-y-2">
                      {/* Current version */}
                      {archivo.ruta && (
                        <li className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-zinc-500 shrink-0 w-7">{archivo.version}</span>
                          <a
                            href={`/archivos/${archivo.ruta}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={archivo.ruta}
                            className="flex-1 min-w-0 text-[#534AB7] hover:underline truncate"
                          >
                            {archivo.ruta}
                          </a>
                          <span className="shrink-0 text-zinc-300">actual</span>
                        </li>
                      )}
                      {/* Past versions — newest first */}
                      {[...archivo.historial].reverse().map((entry, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-zinc-500 shrink-0 w-7">{entry.version}</span>
                          <span className="shrink-0 text-zinc-400">{entry.fecha}</span>
                          <a
                            href={`/archivos/${entry.ruta}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={entry.filename}
                            className="flex-1 min-w-0 text-[#534AB7] hover:underline truncate"
                          >
                            {entry.filename}
                          </a>
                          <button
                            onClick={() => restoreVersion(archivo.id, entry, archivo)}
                            className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            Restaurar
                          </button>
                        </li>
                      ))}
                      {!archivo.ruta && archivo.historial.length === 0 && (
                        <li className="text-xs text-zinc-400">Sin versiones.</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                <div className="pt-2 border-t border-zinc-100">
                  {isEditing('notas') ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-full text-xs border border-[#534AB7] rounded px-2 py-1 outline-none text-zinc-800"
                      placeholder="Agregar nota..."
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(archivo.id, 'notas', archivo.notas)}
                      title="Clic para editar nota"
                      className={`text-xs text-left w-full transition-colors ${
                        archivo.notas
                          ? 'text-zinc-500 hover:text-zinc-800'
                          : 'text-zinc-300 hover:text-zinc-500'
                      }`}
                    >
                      {archivo.notas || 'Agregar nota...'}
                    </button>
                  )}
                </div>

                {/* File attachment */}
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2 min-w-0">
                  {archivo.ruta ? (
                    <>
                      <a
                        href={`/archivos/${archivo.ruta}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={archivo.ruta}
                        className="flex-1 min-w-0 text-xs text-[#534AB7] hover:underline truncate"
                      >
                        {archivo.ruta}
                      </a>
                      <button
                        onClick={() => handleUploadClick(archivo.id)}
                        disabled={isUploading}
                        className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-50 transition-colors"
                      >
                        {isUploading ? 'Subiendo...' : 'Reemplazar'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUploadClick(archivo.id)}
                      disabled={isUploading}
                      className="text-xs text-zinc-400 hover:text-[#534AB7] disabled:opacity-50 transition-colors"
                    >
                      {isUploading ? 'Subiendo...' : '↑ Adjuntar archivo'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
