/**
 * Generates a QR code with rounded dots using canvas.
 * Client-side only.
 */
export async function generateRoundedQR(url: string, size: number = 200): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Client only')

  const QRCode = await import('qrcode')
  // create() returns the raw QR matrix
  const qr = (QRCode as any).create(url, { errorCorrectionLevel: 'M' })

  const count: number = qr.modules.size
  const margin = 2
  const cell = size / (count + margin * 2)
  const offset = margin * cell
  const radius = cell * 0.42 // how rounded the dots are (0 = square, 0.5 = circle)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#000000'

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const isDark = qr.modules.data[row * count + col] !== 0
      if (!isDark) continue

      const x = offset + col * cell + 0.5
      const y = offset + row * cell + 0.5
      const w = cell - 1
      const h = cell - 1

      // Draw rounded rectangle
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + w, y, x + w, y + h, radius)
      ctx.arcTo(x + w, y + h, x, y + h, radius)
      ctx.arcTo(x, y + h, x, y, radius)
      ctx.arcTo(x, y, x + w, y, radius)
      ctx.closePath()
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/png')
}
