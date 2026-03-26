'use client'

import { usePathname } from 'next/navigation'

const sectionTitles: Record<string, string> = {
  '/premisas': 'Premisas',
  '/archivos': 'Archivos',
  '/configuracion': 'Configuración',
}

export default function Topbar() {
  const pathname = usePathname()

  const title =
    Object.entries(sectionTitles).find(
      ([key]) => pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'Dashboard'

  const date = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shrink-0">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <span className="text-sm text-zinc-400 capitalize">{date}</span>
    </header>
  )
}
