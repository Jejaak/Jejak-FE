# Jejak Frontend

Jejak Frontend adalah aplikasi React/Vite untuk permainan literasi keamanan digital berbahasa Indonesia. Aplikasi ini menghadirkan desktop retro, autentikasi melalui browser virtual, tutorial, dan tiga permainan edukatif: Privasi, Phishing, dan Virus.

Browser tidak terhubung langsung ke PostgreSQL atau Prisma. Request autentikasi, progres, sesi permainan, dan WebSocket diarahkan ke Jejak Backend.

## Technology Stack

| Area | Teknologi |
| --- | --- |
| Framework | React 19, Vite 8, TypeScript |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 dan CSS |
| Motion | Motion dengan dukungan reduced motion |
| Authentication | Better Auth client |
| Quality | ESLint dan TypeScript strict mode |

## Features

- Desktop retro dengan shortcut permainan dan taskbar
- Window Browser, Inbox, Profile, dan welcome panel
- Window yang dapat diaktifkan, dipindahkan, diminimalkan, dan ditutup; Browser juga dapat diubah ukurannya dan dimaksimalkan
- Register, login, pemulihan session, dan logout melalui browser virtual
- Route permainan yang dilindungi session pengguna
- Permainan Privasi dengan 15 skenario acak dan umpan balik per keputusan
- Permainan Phishing dengan pemeriksaan pengirim, subjek, isi, tindakan, dan lampiran
- Permainan Virus dengan file realtime, target 15 file aman, dan batas tiga kesalahan
- Tutorial kontekstual pada setiap permainan
- REST fallback dan WebSocket untuk sinkronisasi sesi permainan
- Skip link, fokus route, kontrol semantik, keyboard navigation, live region, dan reduced-motion support

## Routes

| Path | Access | Keterangan |
| --- | --- | --- |
| `/` | Public | Desktop utama Jejak |
| `/login` | Public | Membuka desktop dan browser virtual dalam mode login |
| `/register` | Public | Membuka desktop dan browser virtual dalam mode register |
| `/home` | Public | Redirect ke desktop utama |
| `/game/privacy` | Authenticated | Memulai atau memulihkan permainan Privasi |
| `/game/privacy/:publicId` | Authenticated | Membuka sesi Privasi berdasarkan public ID |
| `/game/phishing` | Authenticated | Memulai atau memulihkan permainan Phishing |
| `/game/downloads` | Authenticated | Membuat permainan Virus baru |
| `/game/downloads/:publicId` | Authenticated | Membuka sesi Virus berdasarkan public ID |

Route yang tidak dikenal diarahkan kembali ke `/`.

## Environment Variables

Buat `.env` dari `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Keterangan |
| --- | --- |
| `VITE_API_URL` | Origin Jejak Backend untuk REST, Better Auth, dan WebSocket |

Nilai `VITE_*` dikirim ke browser dan tidak boleh berisi password, token, database URL, atau secret backend.

## Getting Started

### Prerequisites

- Node.js dan npm
- Jejak Backend berjalan pada `VITE_API_URL`

### Installation

```bash
npm ci
copy .env.example .env
```

### Development

```bash
npm run dev
```

Vite berjalan pada `http://localhost:5173` secara default.

### Build

```bash
npm run build
```

Hasil build production dibuat di direktori `dist`.

### Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Test suite frontend belum disertakan pada project saat ini.

## Project Structure

```text
src/
|-- components/   # Desktop window, taskbar, loading, lives, dan result UI bersama
|-- data/         # Konten statis atau data pendukung frontend
|-- games/        # Screen dan state permainan Privasi, Phishing, dan Virus
|-- lib/          # API URL, auth client, kontrak sesi, progress, dan WebSocket URL
|-- pages/        # Desktop utama dan adapter route autentikasi
|-- app.css       # Token, layout, state visual, responsive rules, dan game styling
|-- app.tsx       # Route registration dan protected route
`-- main.tsx      # React bootstrap dan BrowserRouter

public/assets/
|-- Desktop/      # Ikon taskbar
|-- Game1/        # Aset permainan Privasi
|-- Game2/        # Aset permainan Phishing
|-- Game3/        # Aset permainan Virus
|-- Home/         # Background dan ikon desktop
|-- Shared/       # Maskot serta aset permainan bersama
`-- Logo.png      # Logo Jejak dan favicon
```

## Backend Contract

Frontend hanya merender session snapshot, DTO, dan hasil yang diberikan backend. Frontend tidak boleh menjadi sumber kebenaran untuk kepemilikan sesi, urutan jawaban, validasi jawaban, skor final, atau status selesai.

Perubahan pada payload REST, event WebSocket, public session ID, mode permainan, atau aturan skor harus disinkronkan dengan Jejak Backend di direktori `../Jejak-BE`.

## Current Scope

- Inbox desktop masih berupa placeholder.
- Dedicated progress screen belum terhubung ke route aktif.
- Project belum memiliki test suite atau konfigurasi CI.
- Lisensi source dan aset belum didokumentasikan.
