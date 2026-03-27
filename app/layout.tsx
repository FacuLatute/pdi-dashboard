import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'PDI – AgroEnergía SRL',
  description: 'Dashboard de gestión del Proyecto de Desarrollo Institucional',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="h-full bg-zinc-50 font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
