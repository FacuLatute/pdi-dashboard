'use client'

import { useEffect, useRef, useState } from 'react'

type Estado = 'completa' | 'en_progreso' | 'pendiente'
type Filter = 'all' | Estado

interface Premisa {
  id: number
  titulo: string
  estado: Estado
  pagina: number | null
  notas: string
  archivos_vinculados: number[]
}

interface Archivo {
  id: number
  nombre: string
  tipo: string
  version: string
}

const ESTADO_NEXT: Record<Estado, Estado> = {
  pendiente: 'en_progreso',
  en_progreso: 'completa',
  completa: 'pendiente',
}

const ESTADO_LABEL: Record<Estado, string> = {
  completa: 'Completa',
  en_progreso: 'En progreso',
  pendiente: 'Pendiente',
}

const ESTADO_STYLE: Record<Estado, string> = {
  completa: 'bg-green-100 text-green-700 hover:bg-green-200',
  en_progreso: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  pendiente: 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'completa', label: 'Completadas' },
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'pendiente', label: 'Pendiente' },
]

const TOTAL = 15

const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="13" height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function PremisasPage() {
  const [premisas, setPremisas] = useState<Premisa[]>([])
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  // pagina / notas inline editing
  const [editing, setEditing] = useState<{ id: number; field: 'pagina' | 'notas' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // titulo inline editing
  const [editingTitulo, setEditingTitulo] = useState<number | null>(null)
  const [tituloValue, setTituloValue] = useState('')
  const tituloRef = useRef<HTMLInputElement>(null)

  // delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // expand/collapse
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // archivo link select per premisa
  const [linkSelect, setLinkSelect] = useState<Record<number, string>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/premisas').then((r) => r.json()),
      fetch('/api/archivos').then((r) => r.json()),
    ]).then(([premisasData, archivosData]: [Premisa[], Archivo[]]) => {
      setPremisas(premisasData)
      setArchivos(archivosData)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (editingTitulo !== null) tituloRef.current?.focus()
  }, [editingTitulo])

  async function patch(id: number, fields: Partial<Omit<Premisa, 'id'>>) {
    setPremisas((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)))
    await fetch('/api/premisas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    })
  }

  function startEdit(id: number, field: 'pagina' | 'notas', current: string) {
    setEditing({ id, field })
    setEditValue(current)
  }

  function commitEdit() {
    if (!editing) return
    const { id, field } = editing
    setEditing(null)

    if (field === 'pagina') {
      const trimmed = editValue.trim()
      const num = trimmed === '' ? null : parseInt(trimmed, 10)
      if (trimmed !== '' && isNaN(num as number)) return
      patch(id, { pagina: num })
    } else {
      patch(id, { notas: editValue })
    }
  }

  function cancelEdit() {
    setEditing(null)
  }

  function startEditTitulo(id: number, titulo: string) {
    setEditingTitulo(id)
    setTituloValue(titulo)
  }

  async function commitEditTitulo() {
    if (editingTitulo === null) return
    const id = editingTitulo
    const titulo = tituloValue.trim()
    setEditingTitulo(null)
    if (!titulo) return
    patch(id, { titulo })
  }

  function cancelEditTitulo() {
    setEditingTitulo(null)
  }

  async function deletePremisa(id: number) {
    setPremisas((prev) => prev.filter((p) => p.id !== id))
    setConfirmDelete(null)
    setExpandedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    await fetch('/api/premisas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function linkArchivo(premisaId: number) {
    const selected = parseInt(linkSelect[premisaId] || '', 10)
    if (!selected) return
    const premisa = premisas.find((p) => p.id === premisaId)
    if (!premisa || premisa.archivos_vinculados.includes(selected)) return

    const next = [...premisa.archivos_vinculados, selected]
    setLinkSelect((prev) => ({ ...prev, [premisaId]: '' }))
    patch(premisaId, { archivos_vinculados: next })
  }

  async function unlinkArchivo(premisaId: number, archivoId: number) {
    const premisa = premisas.find((p) => p.id === premisaId)
    if (!premisa) return
    const next = premisa.archivos_vinculados.filter((id) => id !== archivoId)
    patch(premisaId, { archivos_vinculados: next })
  }

  const completed = premisas.filter((p) => p.estado === 'completa').length
  const pct = Math.round((completed / TOTAL) * 100)

  const counts: Record<Filter, number> = {
    all: premisas.length,
    completa: premisas.filter((p) => p.estado === 'completa').length,
    en_progreso: premisas.filter((p) => p.estado === 'en_progreso').length,
    pendiente: premisas.filter((p) => p.estado === 'pendiente').length,
  }

  const filtered = filter === 'all' ? premisas : premisas.filter((p) => p.estado === filter)

  function exportIndex() {
    const d = new Date()
    const today = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    const SEP = '━'.repeat(50)

    const lines: string[] = []
    premisas.forEach((p) => {
      const prefix = `Premisa ${String(p.id).padStart(2, '0')} — ${p.titulo}`
      const value = p.pagina !== null ? `pág. ${p.pagina}` : 'pendiente'
      const dotsCount = Math.max(1, 60 - prefix.length - 1)
      lines.push(`${prefix} ${'.'.repeat(dotsCount)} ${value}`)

      const linked = archivos.filter((a) => p.archivos_vinculados.includes(a.id))
      linked.forEach((a) => {
        lines.push(`  → ${a.nombre} (${a.tipo}, ${a.version})`)
      })
    })

    const inProgress = premisas.filter((p) => p.estado === 'en_progreso').length
    const pending = premisas.filter((p) => p.estado === 'pendiente').length

    const content = [
      `ÍNDICE DE CUMPLIMIENTO DE PREMISAS — AgroEnergía SRL`,
      `PDI 1 — Cierre 31/07/2026`,
      `Generado el: ${today}`,
      '',
      SEP,
      '',
      ...lines,
      '',
      SEP,
      '',
      `Resumen al ${today}:`,
      `  ${'Completas:'.padEnd(14)} ${completed} / ${TOTAL}`,
      `  ${'En progreso:'.padEnd(14)} ${inProgress} / ${TOTAL}`,
      `  ${'Pendientes:'.padEnd(14)} ${pending} / ${TOTAL}`,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `indice-premisas-${today.replace(/\//g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Cargando...</p>
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Progress bar + export */}
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">Progreso general</span>
            <span>{completed} / {TOTAL} completadas — {pct}%</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#534AB7] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={exportIndex}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
        >
          Exportar índice
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5 border-b border-zinc-200">
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              filter === key
                ? 'border-[#534AB7] text-[#534AB7]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${
                filter === key
                  ? 'bg-[#534AB7]/10 text-[#534AB7]'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100">
        {/* Header */}
        <div className="grid grid-cols-[2.5rem_1fr_8rem_4.5rem_1fr_5.5rem] gap-3 px-4 py-2 bg-zinc-50 border-b border-zinc-200">
          <span className="text-xs font-medium text-zinc-400">#</span>
          <span className="text-xs font-medium text-zinc-400">Premisa</span>
          <span className="text-xs font-medium text-zinc-400">Estado</span>
          <span className="text-xs font-medium text-zinc-400">Página</span>
          <span className="text-xs font-medium text-zinc-400">Notas</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-zinc-400">Sin resultados</div>
        )}

        {filtered.map((premisa) => {
          // Delete confirmation — replaces entire row
          if (confirmDelete === premisa.id) {
            return (
              <div key={premisa.id} className="flex items-center justify-between px-4 py-3 bg-red-50/40">
                <span className="text-sm text-zinc-600 truncate pr-4 min-w-0">
                  ¿Eliminar{' '}
                  <span className="font-medium text-zinc-800">{premisa.titulo}</span>?
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => deletePremisa(premisa.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )
          }

          const isEditingPagina = editing?.id === premisa.id && editing.field === 'pagina'
          const isEditingNotas = editing?.id === premisa.id && editing.field === 'notas'
          const isEditingThisTitulo = editingTitulo === premisa.id
          const isExpanded = expandedIds.has(premisa.id)

          const linkedArchivos = archivos.filter((a) => premisa.archivos_vinculados.includes(a.id))
          const availableArchivos = archivos.filter((a) => !premisa.archivos_vinculados.includes(a.id))

          return (
            <div key={premisa.id}>
              {/* Main row */}
              <div className="group grid grid-cols-[2.5rem_1fr_8rem_4.5rem_1fr_5.5rem] items-center gap-3 px-4 py-3 hover:bg-zinc-50/60 transition-colors">
                {/* Number */}
                <span className="text-xs font-mono text-zinc-300 tabular-nums select-none">
                  {String(premisa.id).padStart(2, '0')}
                </span>

                {/* Title */}
                {isEditingThisTitulo ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <input
                      ref={tituloRef}
                      type="text"
                      value={tituloValue}
                      onChange={(e) => setTituloValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditTitulo()
                        if (e.key === 'Escape') cancelEditTitulo()
                      }}
                      className="flex-1 min-w-0 text-sm border border-[#534AB7] rounded px-2 py-0.5 outline-none text-zinc-800"
                    />
                    <button onClick={commitEditTitulo} title="Confirmar" className="shrink-0 p-0.5 text-green-600 hover:text-green-700 transition-colors">
                      <IconCheck />
                    </button>
                    <button onClick={cancelEditTitulo} title="Cancelar" className="shrink-0 p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                      <IconX />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-800 leading-snug">{premisa.titulo}</span>
                )}

                {/* Status badge */}
                <button
                  onClick={() => patch(premisa.id, { estado: ESTADO_NEXT[premisa.estado] })}
                  title="Clic para cambiar estado"
                  className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-colors ${ESTADO_STYLE[premisa.estado]}`}
                >
                  {ESTADO_LABEL[premisa.estado]}
                </button>

                {/* Page */}
                {isEditingPagina ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="w-full text-xs border border-[#534AB7] rounded px-2 py-1 outline-none text-zinc-800 tabular-nums"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(premisa.id, 'pagina', premisa.pagina !== null ? String(premisa.pagina) : '')}
                    className="text-xs text-left w-full text-zinc-500 hover:text-zinc-800 tabular-nums"
                    title="Clic para editar página"
                  >
                    {premisa.pagina !== null ? `p.\u00a0${premisa.pagina}` : '—'}
                  </button>
                )}

                {/* Notes */}
                {isEditingNotas ? (
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
                    onClick={() => startEdit(premisa.id, 'notas', premisa.notas)}
                    className={`text-xs text-left w-full truncate ${
                      premisa.notas ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-300 hover:text-zinc-500'
                    }`}
                    title="Clic para editar nota"
                  >
                    {premisa.notas || 'Agregar nota...'}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {!isEditingThisTitulo && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditTitulo(premisa.id, premisa.titulo)}
                        title="Editar título"
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                      >
                        <IconPencil />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(premisa.id)}
                        title="Eliminar"
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition-colors"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => toggleExpanded(premisa.id)}
                    title={isExpanded ? 'Colapsar' : 'Expandir archivos vinculados'}
                    className={`p-1.5 rounded transition-colors ${
                      isExpanded ? 'text-[#534AB7]' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <IconChevron expanded={isExpanded} />
                  </button>
                </div>
              </div>

              {/* Expanded: archivos vinculados */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-2 border-t border-zinc-100 bg-zinc-50/50">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Archivos vinculados
                  </p>

                  {linkedArchivos.length === 0 ? (
                    <p className="text-xs text-zinc-400 mb-2">Sin archivos vinculados.</p>
                  ) : (
                    <ul className="space-y-1 mb-2">
                      {linkedArchivos.map((archivo) => (
                        <li key={archivo.id} className="flex items-center gap-2">
                          <span className="text-xs text-zinc-700 leading-snug">{archivo.nombre}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono leading-none">
                            {archivo.tipo}
                          </span>
                          <span className="text-[10px] text-zinc-400">{archivo.version}</span>
                          <button
                            onClick={() => unlinkArchivo(premisa.id, archivo.id)}
                            title="Desvincular"
                            className="ml-auto p-0.5 text-zinc-300 hover:text-red-400 transition-colors"
                          >
                            <IconX />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {availableArchivos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={linkSelect[premisa.id] || ''}
                        onChange={(e) =>
                          setLinkSelect((prev) => ({ ...prev, [premisa.id]: e.target.value }))
                        }
                        className="flex-1 min-w-0 text-xs border border-zinc-200 rounded px-2 py-1.5 outline-none focus:border-[#534AB7] bg-white text-zinc-700"
                      >
                        <option value="">Seleccionar archivo…</option>
                        {availableArchivos.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre} ({a.tipo}, {a.version})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => linkArchivo(premisa.id)}
                        disabled={!linkSelect[premisa.id]}
                        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded bg-[#534AB7] text-white hover:bg-[#4640a3] transition-colors disabled:opacity-40"
                      >
                        Vincular
                      </button>
                    </div>
                  )}

                  {availableArchivos.length === 0 && linkedArchivos.length === archivos.length && archivos.length > 0 && (
                    <p className="text-xs text-zinc-400 pt-1">Todos los archivos están vinculados.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
