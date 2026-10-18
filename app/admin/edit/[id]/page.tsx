'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateRoundedQR } from '@/lib/qr-styled'

type QRType = 'url' | 'whatsapp' | 'instagram' | 'wifi' | 'maps' | 'google_reviews'

interface FormState {
  name: string
  type: QRType
  // url type
  url: string
  // whatsapp type
  phone: string
  // instagram type
  instagram: string
  // wifi type
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: 'WPA' | 'WEP' | 'nopass'
  // maps type
  address: string
  // google_reviews type
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

function parseExisting(url: string | null, type: QRType): Partial<FormState> {
  if (!url) return {}
  switch (type) {
    case 'whatsapp': {
      const digits = url.replace('https://wa.me/', '')
      const local = digits.startsWith('55') ? digits.slice(2) : digits
      return { phone: formatPhone(local) }
    }
    case 'instagram': {
      const username = url.replace('https://instagram.com/', '').replace('https://www.instagram.com/', '')
      return { instagram: username }
    }
    case 'wifi': {
      const ssid = url.match(/S:([^;]*)/)?.[1] || ''
      const password = url.match(/P:([^;]*)/)?.[1] || ''
      const security = (url.match(/T:([^;]*)/)?.[1] || 'WPA') as 'WPA' | 'WEP' | 'nopass'
      return { wifiSsid: ssid, wifiPassword: password, wifiSecurity: security }
    }
    case 'maps': {
      try {
        const u = new URL(url)
        return { address: decodeURIComponent(u.searchParams.get('query') || '') }
      } catch { return { address: url } }
    }
    case 'google_reviews':
      return { reviewUrl: url }
    case 'url':
    default:
      return { url }
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
  { value: 'wifi',           label: 'Rede Wi-Fi',         emoji: '📶', desc: 'Conecta automaticamente ao Wi-Fi' },
  { value: 'google_reviews', label: 'Google Avaliações',  emoji: '⭐', desc: 'Abre página de avaliações no Google' },
  { value: 'maps',           label: 'Google Maps',        emoji: '📍', desc: 'Abre endereço no Maps' },
  { value: 'url',            label: 'URL Personalizada',  emoji: '🔗', desc: 'Qualquer link da internet' },
]

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${id}` : `/r/${id}`

  const [form, setForm] = useState<FormState>({
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
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Generate QR for the public redirect URL (what's printed on the plate)
  useEffect(() => {
    generateRoundedQR(publicUrl, 200).then(setQrDataUrl).catch(() => {})
  }, [publicUrl])

  useEffect(() => {
    fetch(`/api/qr/${id}`)
      .then(r => r.json())
      .then(data => {
        const type: QRType = data.type || 'url'
        const parsed = parseExisting(data.url, type)
        setForm(prev => ({
          ...prev,
          name: data.name || '',
          type,
          url: 'https://',
          ...parsed,
        }))
        setLoading(false)
      })
      .catch(() => { setError('Erro ao carregar'); setLoading(false) })
  }, [id])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))
  }, [])

  const handleTypeChange = useCallback((type: QRType) => {
    setForm(prev => ({ ...prev, type }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const url = buildUrl(form)
    try {
      const res = await fetch(`/api/qr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim() || null, url: url || null, type: form.type }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este QR Code?')) return
    await fetch(`/api/qr/${id}`, { method: 'DELETE' })
    router.push('/admin')
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500">Carregando…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold ml-auto">Editar QR Code</h1>
        </div>

        {/* QR Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <div className="bg-white p-3 rounded-2xl overflow-hidden">
              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
            </div>
          ) : (
            <div className="w-40 h-40 bg-zinc-800 rounded-xl animate-pulse" />
          )}
          <div className="text-center">
            <p className="text-zinc-500 text-xs mb-1">Link público da plaquinha</p>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="text-emerald-400 text-sm hover:underline font-mono break-all">
              {publicUrl}
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Nome da plaquinha</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Mesa 1, Entrada, Wi-Fi Clientes…"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-zinc-400 text-sm mb-3">Tipo de redirecionamento</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTypeChange(opt.value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all ${
                    form.type === opt.value
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{opt.label}</p>
                    <p className="text-xs text-zinc-500 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic inputs per type */}

          {form.type === 'whatsapp' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Número de WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🇧🇷 +55</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-20 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {form.phone && (
                <p className="text-zinc-500 text-xs mt-2">
                  Link: https://wa.me/55{form.phone.replace(/\D/g, '')}
                </p>
              )}
            </div>
          )}

          {form.type === 'instagram' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Usuário do Instagram</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value.replace(/^@/, '') }))}
                  placeholder="seuperfil"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {form.instagram && (
                <p className="text-zinc-500 text-xs mt-2">
                  Link: https://instagram.com/{form.instagram}
                </p>
              )}
            </div>
          )}

          {form.type === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Nome da rede (SSID)</label>
                <input
                  type="text"
                  value={form.wifiSsid}
                  onChange={e => setForm(prev => ({ ...prev, wifiSsid: e.target.value }))}
                  placeholder="MinhaRede"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Segurança</label>
                <div className="flex gap-2">
                  {(['WPA', 'WEP', 'nopass'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, wifiSecurity: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.wifiSecurity === s
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {s === 'nopass' ? 'Aberta' : s}
                    </button>
                  ))}
                </div>
              </div>
              {form.wifiSecurity !== 'nopass' && (
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Senha</label>
                  <input
                    type="text"
                    value={form.wifiPassword}
                    onChange={e => setForm(prev => ({ ...prev, wifiPassword: e.target.value }))}
                    placeholder="senha123"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              )}
              <p className="text-zinc-600 text-xs">
                💡 Ao escanear, o celular conecta automaticamente ao Wi-Fi (a maioria dos celulares modernos suporta).
              </p>
            </div>
          )}

          {form.type === 'google_reviews' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Link de Avaliações do Google</label>
              <input
                type="url"
                value={form.reviewUrl}
                onChange={e => setForm(prev => ({ ...prev, reviewUrl: e.target.value }))}
                placeholder="https://g.page/r/.../review"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-400 text-xs font-medium mb-2">Como obter seu link:</p>
                <ol className="text-zinc-500 text-xs space-y-1 list-decimal list-inside">
                  <li>Abra o <strong className="text-zinc-400">Google Maps</strong></li>
                  <li>Busque pelo nome do seu estabelecimento</li>
                  <li>Clique em <strong className="text-zinc-400">Compartilhar</strong> → <strong className="text-zinc-400">Copiar link</strong></li>
                  <li>Cole o link aqui</li>
                </ol>
              </div>
            </div>
          )}

          {form.type === 'maps' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua das Flores, 123, São Paulo - SP"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {form.address && (
                <p className="text-zinc-500 text-xs mt-2">
                  Vai abrir o Google Maps com o endereço digitado
                </p>
              )}
            </div>
          )}

          {form.type === 'url' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">URL de destino</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seusite.com.br"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 transition-colors"
            >
              {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400 transition-colors"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
