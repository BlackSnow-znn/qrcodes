'use client'

import { useEffect, useRef, useState } from 'react'

type CardType = 'whatsapp' | 'instagram' | 'wifi' | 'google_reviews'

const TEMPLATE_MAP: Record<CardType, string> = {
  whatsapp: '/templates/whatsapp.png',
  instagram: '/templates/instagram.png',
  wifi: '/templates/wifi.png',
  google_reviews: '/templates/google.png',
}

// QR position as fraction of template size
// Right lower area — centered where "APONTE A CAMERA" text is
const QR_POS = {
  cx: 0.715,  // center X (fraction of card width)
  cy: 0.745,  // center Y (fraction of card height)
  size: 0.30, // QR size as fraction of card width
}

interface CardPreviewProps {
  type: CardType
  qrDataUrl: string // base64 data URL of the QR image
}

export default function CardPreview({ type, qrDataUrl }: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)
  const [downloading, setDownloading] = useState<'png' | 'pdf' | null>(null)

  useEffect(() => {
    if (!qrDataUrl) { setRendered(false); return }
    const canvas = canvasRef.current
    if (!canvas) return

    const template = new Image()
    const qr = new Image()
    let loaded = 0

    const draw = () => {
      loaded++
      if (loaded < 2) return

      const ctx = canvas.getContext('2d')!
      canvas.width = template.naturalWidth
      canvas.height = template.naturalHeight

      // Draw template
      ctx.drawImage(template, 0, 0)

      // QR dimensions
      const qrSize = Math.round(canvas.width * QR_POS.size)
      const qrX = Math.round(canvas.width * QR_POS.cx - qrSize / 2)
      const qrY = Math.round(canvas.height * QR_POS.cy - qrSize / 2)

      // White rounded card behind QR
      const pad = Math.round(qrSize * 0.07)
      const radius = Math.round(qrSize * 0.12)
      const bx = qrX - pad, by = qrY - pad
      const bw = qrSize + pad * 2, bh = qrSize + pad * 2

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(bx + radius, by)
      ctx.lineTo(bx + bw - radius, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius)
      ctx.lineTo(bx + bw, by + bh - radius)
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh)
      ctx.lineTo(bx + radius, by + bh)
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius)
      ctx.lineTo(bx, by + radius)
      ctx.quadraticCurveTo(bx, by, bx + radius, by)
      ctx.closePath()
      ctx.fill()

      // Draw QR
      ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)

      setRendered(true)
    }

    template.onload = draw
    qr.onload = draw
    template.onerror = () => setRendered(false)
    qr.onerror = () => setRendered(false)

    template.src = TEMPLATE_MAP[type]
    qr.src = qrDataUrl
  }, [type, qrDataUrl])

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading('png')
    canvas.toBlob(blob => {
      if (!blob) { setDownloading(null); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-plaquinha-${type}.png`
      a.click()
      URL.revokeObjectURL(url)
      setDownloading(null)
    }, 'image/png')
  }

  const downloadPdf = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      // Card physical size: 10x15cm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'cm',
        format: [10, 15],
      })
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 10, 15)
      pdf.save(`qr-plaquinha-${type}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(null)
  }

  if (!qrDataUrl) return null

  return (
    <div className="space-y-3">
      <label className="text-zinc-400 text-sm block">Preview da plaquinha</label>

      {/* Card preview */}
      <div className="flex justify-center">
        <div className="relative w-48 rounded-2xl overflow-hidden border border-zinc-700 shadow-xl">
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            style={{ display: rendered ? 'block' : 'none' }}
          />
          {!rendered && (
            <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center rounded-2xl">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Download buttons */}
      {rendered && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={downloadPng}
            disabled={!!downloading}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95"
          >
            {downloading === 'png' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            PNG
          </button>
          <button
            onClick={downloadPdf}
            disabled={!!downloading}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95"
          >
            {downloading === 'pdf' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
