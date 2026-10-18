'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'

type QRType = 'url' | 'whatsapp' | 'instagram' | 'wifi' | 'maps' | 'google_reviews'

interface FormState {
  name: string
  type: QRType
  url: string
  phone: string
  instagram: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: 'WPA' | 'WEP' | 'nopass'
  address: string
  reviewUrl: string
}

function buildUrl(form: FormState): string {
  switch (form.type) {
    case 'whatsapp': {
      const digits = form.phone.replace(/\D/g, '')
      const full = digits.startsWith('55') ? digits : `55${digits}`
      return `https://wa.me/${full}`
    }
    case 'instagram':
      return `https://instagram.com/${form.instagram.replace(/^@/, '')}`
    case 'wifi':
      return `WIFI:T:${form.wifiSecurity};S:${form.wifiSsid};P:${form.wifiPassword};;`
    case 'maps':
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`
    case 'google_reviews':
      return form.reviewUrl.trim()
    case 'url':
    default:
      return form.url.trim()
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const TYPE_OPTIONS: { value: QRType; label: string; emoji: string; desc: string }[] = [
  { value: 'whatsapp',       label: 'WhatsApp',          emoji: '💬', desc: 'Abre conversa no WhatsApp' },
  { value: 'instagram',      label: 'Instagram',          emoji: '📸', desc: 'Abre perfil no Instagram' },
  { value: 'wifi',           label: 'Rede Wi-Fi',         emoji: '📶', desc: 'Conecta ao Wi-Fi automático' },
  { value: 'google_reviews', label: 'Google Avaliações',  emoji: '⭐', desc: 'Página de avaliações' },
  { value: 'maps',           label: 'Google Maps',        emoji: '📍', desc: 'Abre endereço no Maps' },
  { value: 'url',            label: 'URL Personalizada',  emoji: '🔗', desc: 'Qualquer link da internet' },
]

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'url',
  url: 'https://',
  phone: '',
  instagram: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  address: '',
  reviewUrl: '',
}

export default function QRCreate({ onClose }: { onClose: (created?: boolean) => void }) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Generate live QR preview based on current form values
  useEffect(() => {
    const url = buildUrl(form)
    if (!url || url === 'https://' || url === 'https://wa.me/55' || url === 'https://instagram.com/') {
      setQrDataUrl('')
      return
    }
    QRCode.toDataURL(url, {
      width: 160,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [form])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    const url = buildUrl(form)
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || null,
          url: url || null,
          type: form.type,
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar QR Code')
      onClose(true)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Novo QR Code</h2>
            <button
              onClick={() => onClose()}
              className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* QR Preview */}
          <div className="flex justify-center">
            {qrDataUrl ? (
              <div className="bg-white p-2.5 rounded-xl">
                <img src={qrDataUrl} alt="Preview QR" className="w-28 h-28" />
              </div>
            ) : (
              <div className="w-28 h-28 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-600 text-xs text-center px-2">Preencha os dados para ver o QR</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">Nome da plaquinha</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Mesa 1, Entrada, Wi-Fi…"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600"
              autoFocus
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Tipo de redirecionamento</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all ${
                    form.type === opt.value
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <div>
                    <p className="text-xs font-medium leading-tight">{opt.label}</p>
                    <p className="text-xs text-zinc-500 leading-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic inputs */}

          {form.type === 'whatsapp' && (
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Número de WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🇧🇷 +55</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-20 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {form.type === 'instagram' && (
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Usuário do Instagram</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value.replace(/^@/, '') }))}
                  placeholder="seuperfil"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {form.type === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">Nome da rede (SSID)</label>
                <input
                  type="text"
                  value={form.wifiSsid}
                  onChange={e => setForm(prev => ({ ...prev, wifiSsid: e.target.value }))}
                  placeholder="MinhaRede"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">Segurança</label>
                <div className="flex gap-1.5">
                  {(['WPA', 'WEP', 'nopass'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, wifiSecurity: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.wifiSecurity === s
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {s === 'nopass' ? 'Aberta' : s}
                    </button>
                  ))}
                </div>
              </div>
              {form.wifiSecurity !== 'nopass' && (
                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Senha</label>
                  <input
                    type="text"
                    value={form.wifiPassword}
                    onChange={e => setForm(prev => ({ ...prev, wifiPassword: e.target.value }))}
                    placeholder="senha123"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {form.type === 'google_reviews' && (
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Link de Avaliações do Google</label>
              <input
                type="url"
                value={form.reviewUrl}
                onChange={e => setForm(prev => ({ ...prev, reviewUrl: e.target.value }))}
                placeholder="https://g.page/r/.../review"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-zinc-600 text-xs mt-1.5">
                Google Maps → seu negócio → Compartilhar → Copiar link
              </p>
            </div>
          )}

          {form.type === 'maps' && (
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua das Flores, 123, São Paulo"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {form.type === 'url' && (
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">URL de destino</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seusite.com.br"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-zinc-600 text-xs mt-1.5">Pode configurar depois pela lista</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando...
              </span>
            ) : 'Criar QR Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
