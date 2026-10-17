# QR Plaquinha 🪧

Sistema de redirecionamento dinâmico para plaquinhas com NFC e QR Code.
Escaneia o QR Code da plaquinha no painel e configura para onde ele redireciona — tudo no celular, na frente do cliente.

---

## Como funciona

1. Você gera QR Codes no painel e imprime
2. Cola o QR Code na plaquinha (junto com a tag NFC que você configura pelo NFC Tools)
3. Quando chega num estabelecimento, abre o painel, escaneia o QR da plaquinha com a câmera e edita os links
4. O cliente escaneia a plaquinha e é direcionado para o Google Review, Instagram, WhatsApp, etc.

---

## Deploy — Passo a Passo

### 1. Criar o banco de dados no Firebase (grátis)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto
2. No menu lateral, vá em **Firestore Database** → **Criar banco de dados**
   - Escolha **Modo de produção** (você vai ajustar as regras abaixo)
   - Selecione a região (ex: `southamerica-east1` para SP)
3. Nas **Regras do Firestore**, substitua pelo seguinte para bloquear acesso direto do cliente:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
4. Vá em **Configurações do Projeto** (ícone de engrenagem) → **Contas de Serviço**
5. Clique em **Gerar nova chave privada** → baixe o arquivo JSON
6. Do JSON, você vai precisar de:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (cole o valor inteiro, com as aspas)

> ✅ O Firebase **não pausa** projetos gratuitos como o Supabase. O plano Spark (grátis) inclui 50.000 leituras e 20.000 escritas por dia — mais do que suficiente.

---

### 2. Fazer o deploy no Vercel (grátis)

1. Faça o upload deste projeto para o GitHub (repositório pode ser privado)
2. Acesse [vercel.com](https://vercel.com), clique em **Add New Project** e importe o repositório
3. Antes de confirmar, adicione as **variáveis de ambiente**:

| Variável | Onde pegar |
|---|---|
| `FIREBASE_PROJECT_ID` | Do JSON da chave do Firebase |
| `FIREBASE_CLIENT_EMAIL` | Do JSON da chave do Firebase |
| `FIREBASE_PRIVATE_KEY` | Do JSON — cole o valor completo entre aspas |
| `ADMIN_PASSWORD` | Crie uma senha forte para o painel |
| `ADMIN_SECRET` | Texto aleatório longo (gere em uuidgenerator.net) |
| `NEXT_PUBLIC_BASE_URL` | A URL do Vercel após o deploy (ex: `https://meu-projeto.vercel.app`) |

4. Clique em **Deploy** e aguarde (~2 minutos)

> 💡 Após o primeiro deploy você terá a URL. Volte nas variáveis de ambiente do Vercel, atualize `NEXT_PUBLIC_BASE_URL` com a URL real e clique em **Redeploy**.

---

### 3. Usar o sistema

- **Painel admin:** `https://seu-projeto.vercel.app/admin`
- Entre com a senha definida em `ADMIN_PASSWORD`
- **Gerar** → cria QR Codes em lote para imprimir e colar nas plaquinhas
- **Escanear** → abre a câmera, aponta pro QR Code da plaquinha e edita os links na hora

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# Preencha o .env.local com suas variáveis do Firebase
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000)

---

## Tecnologias

- [Next.js 14](https://nextjs.org/) — framework React
- [Firebase Firestore](https://firebase.google.com/) — banco de dados
- [Vercel](https://vercel.com/) — hospedagem
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — scanner de QR Code com câmera
- [qrcode](https://github.com/soldair/node-qrcode) — geração de QR Codes
- [Tailwind CSS](https://tailwindcss.com/) — estilização
