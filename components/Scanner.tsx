'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScannerProps {
  onClose: () => void
}

export default function Scanner({ onClose }: ScannerProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'scanning' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin

  useEffect(() => {
    let mounted = true

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner, Html5QrcodeScanType } = await import('html5-qrcode')

        if (!mounted) return

        const scanner = new Html5QrcodeScanner(
          'qr-scanner-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          },
          false
        )

        scanner.render(
          (decodedText: string) => {
            // Sucesso! Extrair o ID do QR Code
            if (!mounted) return

            setStatus('success')
            scannerRef.current?.clear().catch(() => {})

            // Tenta extrair o ID da URL: /r/[ID]
            const match = decodedText.match(/\/r\/([A-Za-z0-9]+)$/)
            if (match) {
              const id = match[1]
              setTimeout(() => {
                router.push(`/admin/edit/${id}`)
              }, 600)
            } else {
              setStatus('error')
              setErrorMsg(`QR Code não reconhecido: ${decodedText}`)
            }
          },
          () => {
            // Erros de leitura são normais durante o scan, ignorar
          }
        )

        scannerRef.current = scanner
        if (mounted) setStatus('scanning')
      } catch (err) {
        if (mounted) {
          setStatus('error')
          setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões.')
        }
      }
    }

    initScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [router])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h2 className="text-white font-bold text-lg">Escanear Plaquinha</h2>
          <p className="text-zinc-400 text-sm">Aponte para o QR Code da plaquinha</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p>Iniciando câmera...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">QR Code lido!</p>
            <p className="text-zinc-400 text-sm">Redirecionando para edição...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white font-semibold">Erro</p>
            <p className="text-zinc-400 text-sm">{errorMsg}</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Container do html5-qrcode — sempre renderizado mas visível só quando scanning */}
        <div
          id="qr-scanner-container"
          ref={containerRef}
          className={`w-full max-w-sm ${status === 'scanning' ? 'block' : 'hidden'}`}
        />

        {status === 'scanning' && (
          <p className="mt-4 text-zinc-500 text-sm text-center">
            Centralize o QR Code na câmera
          </p>
        )}
      </div>
    </div>
  )
}
