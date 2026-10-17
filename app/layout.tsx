import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Plaquinha',
  description: 'Sistema de redirecionamento para plaquinhas NFC e QR Code',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-zinc-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
