'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Scanner({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const activeRef = useRef(true)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'success' | 'error'>('starting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let jsQR: any

    async function init() {
      try {
        const mod = await import('jsqr')
        jsQR = mod.default

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })

        if (!activeRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setStatus('scanning')
        tick()
      } catch (e: any) {
        if (!activeRef.current) return
        setStatus('error')
        if (e.name === 'NotAllowedError') {
          setErrorMsg('Permissão de câmera negada. Libere o acesso nas configurações do navegador.')
        } else {
          setErrorMsg('Não foi possível acessar a câmera: ' + e.message)
        }
      }
    }

    function tick() {
      if (!activeRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const w = video.videoWidth
      const h = video.videoHeight
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, w, h)
      const img = ctx.getImageData(0, 0, w, h)
      const result = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })
      if (result) {
        stop()
        handleResult(result.data)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    function stop() {
      activeRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }

    init()
    return () => {
      activeRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function handleResult(text: string) {
    const match = text.match(/\/r\/([A-Za-z0-9]+)/)
    if (match) {
      setStatus('success')
      setTimeout(() => {
        onClose()
        router.push(`/admin/edit/${match[1]}`)
      }, 600)
    } else {
      setStatus('error')
      setErrorMsg(`QR Code não reconhecido. Certifique-se que é uma plaquinha do sistema.`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg">Escanear Plaquinha</h2>
          <p className="text-zinc-400 text-sm">Aponte a câmera para o QR Code</p>
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

      <div className="flex-1 relative overflow-hidden">
        {/* Vídeo da câmera — sempre montado */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay de estado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {status === 'starting' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm bg-black/70 px-4 py-2 rounded-lg">Iniciando câmera...</p>
            </div>
          )}

          {status === 'scanning' && (
            <>
              {/* Guia visual */}
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
                {/* Cantos coloridos */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              </div>
              <p className="text-white text-sm mt-6 bg-black/70 px-4 py-2 rounded-lg">
                Centralize o QR Code
              </p>
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold bg-black/70 px-4 py-2 rounded-lg">
                Lido! Abrindo edição...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-white font-semibold">{errorMsg}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
