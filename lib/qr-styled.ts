/**
 * Generates a styled QR code with rounded dots and returns a data URL.
 * Only runs client-side (browser).
 */
export async function generateRoundedQR(url: string, size: number = 200): Promise<string> {
  const QRCodeStyling = (await import('qr-code-styling')).default

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: url,
    margin: Math.round(size * 0.04),
    dotsOptions: {
      color: '#000000',
      type: 'rounded',
    },
    cornersSquareOptions: {
      color: '#000000',
      type: 'extra-rounded',
    },
    cornersDotOptions: {
      color: '#000000',
      type: 'dot',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 4,
    },
  })

  const blob = await qrCode.getRawData('png')
  if (!blob) throw new Error('Failed to generate QR')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
