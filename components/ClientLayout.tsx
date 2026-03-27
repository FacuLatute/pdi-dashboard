'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64 min-h-full">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
