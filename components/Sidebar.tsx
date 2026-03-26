'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/premisas', label: 'Premisas' },
  { href: '/archivos', label: 'Archivos' },
  { href: '/configuracion', label: 'Configuración' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-200">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">PDI</span>
        <h1 className="text-sm font-bold text-zinc-900 mt-1 leading-tight">AgroEnergía SRL</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#534AB7] text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
