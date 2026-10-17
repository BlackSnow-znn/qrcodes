import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Garante que só inicializa uma vez (importante no Next.js com hot-reload)
const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // A chave privada vem como string com \n literais — precisa converter
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : getApps()[0]

export const db = getFirestore(app)

export type QRCode = {
  id: string
  name: string | null
  google_review: string | null
  instagram: string | null
  whatsapp: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  created_at: string
  updated_at: string
}
