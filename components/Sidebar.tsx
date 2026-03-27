'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/premisas', label: 'Premisas' },
  { href: '/archivos', label: 'Archivos' },
  { href: '/configuracion', label: 'Configuración' },
]

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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
      <div className="px-3 pb-4 border-t border-zinc-100 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <IconLogout />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
