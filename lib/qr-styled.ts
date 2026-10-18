import QRCode from 'qrcode'

/** Simple wrapper — generates a QR code data URL using the qrcode library. */
export async function generateRoundedQR(url: string, size: number = 200): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
