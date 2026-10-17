'use client'

import { useState, useRef, useEffect } from 'react'

interface QRItem {
  id: string
  url: string
}

export default function QRBatch({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(10)
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form')
  const [codes, setCodes] = useState<QRItem[]>([])
  const [qrImages, setQrImages] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const generateQRImages = async (items: QRItem[]) => {
    const QRCode = (await import('qrcode')).default
    const images: Record<string, string> = {}

    for (const item of items) {
      images[item.id] = await QRCode.toDataURL(item.url, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }

    setQrImages(images)
  }

  const handleGenerate = async () => {
    setStep('loading')
    setError('')

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao gerar')
      }

      const data: QRItem[] = await res.json()
      setCodes(data)
      await generateQRImages(data)
      setStep('done')
    } catch (err: any) {
      setError(err.message)
      setStep('form')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header — esconde na impressão */}
      <div className="print:hidden flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h2 className="text-white font-bold text-lg">Gerar QR Codes</h2>
          <p className="text-zinc-400 text-sm">
            {step === 'done' ? `${codes.length} códigos gerados` : 'Gera e imprime as etiquetas'}
          </p>
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

      <div className="flex-1 overflow-y-auto">
        {/* Formulário */}
        {step === 'form' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
            <div className="w-full max-w-xs">
              <label className="block text-zinc-400 text-sm mb-2">Quantidade de QR Codes</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-center text-2xl font-bold border border-zinc-700 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-zinc-500 text-xs mt-2 text-center">Máximo 100 por vez</p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-lg transition-colors"
            >
              Gerar {count} QR Code{count !== 1 ? 's' : ''}
            </button>

            <p className="text-zinc-500 text-xs text-center max-w-xs">
              Os QR Codes serão criados no banco de dados. Depois é só imprimir e colar nas plaquinhas.
            </p>
          </div>
        )}

        {/* Carregando */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400">Gerando QR Codes...</p>
          </div>
        )}

        {/* Grid de QR Codes para impressão */}
        {step === 'done' && (
          <div>
            {/* Botão imprimir — esconde na impressão */}
            <div className="print:hidden sticky top-0 bg-zinc-950/95 backdrop-blur p-3 border-b border-zinc-800 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir / Salvar PDF
              </button>
              <button
                onClick={() => setStep('form')}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                Gerar mais
              </button>
            </div>

            {/* Grid para impressão */}
            <div
              className="grid gap-4 p-6"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
            >
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex flex-col items-center gap-2 p-3 border border-zinc-800 print:border-gray-300 rounded-xl print:rounded-none bg-zinc-900 print:bg-white"
                >
                  {qrImages[code.id] ? (
                    <img
                      src={qrImages[code.id]}
                      alt={`QR ${code.id}`}
                      className="w-[150px] h-[150px]"
                    />
                  ) : (
                    <div className="w-[150px] h-[150px] bg-zinc-800 animate-pulse rounded" />
                  )}
                  <p className="text-zinc-400 print:text-gray-600 text-xs font-mono tracking-wider">
                    {code.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  )
}
