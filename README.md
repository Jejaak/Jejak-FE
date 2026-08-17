# JEJAK Frontend

JEJAK adalah permainan edukasi keamanan digital berbahasa Indonesia untuk membantu anak mengenali risiko privasi, phishing, dan file berbahaya melalui simulasi interaktif bergaya desktop retro.

- Website: https://jejaak.my.id
- Backend API: https://api.jejaak.my.id
- API Documentation: https://api.jejaak.my.id/api/docs
- Backend Repository: https://github.com/Jejaak/Jejak-BE

## Fitur Utama

- Landing page publik responsif dengan tab Beranda, Permainan, dan Cara Belajar.
- Onboarding desktop 12 langkah yang disimpan di `localStorage`.
- Registrasi, login, pemulihan sesi, dan logout melalui Better Auth.
- Game Privasi: memilih apakah informasi aman dibagikan.
- Game Phishing: memeriksa pengirim, isi, tautan, dan lampiran email.
- Game Virus: menghapus file mencurigakan sebelum mencapai komputer.
- Session ID publik, penyimpanan progres, WebSocket realtime, tutorial kontekstual, lives, dan hasil permainan.
- Layout desktop, tablet, dan mobile dengan dukungan keyboard serta reduced motion.

## Teknologi

- React 19
- TypeScript 5.9 strict mode
- Vite 8
- React Router 7
- Tailwind CSS 4 dan CSS responsif
- Motion
- Better Auth client
- WebSocket browser API
- Fixed System Excelsior typeface

## Route

| Route | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Landing page informasi JEJAK |
| `/home` | Publik | Desktop JEJAK, onboarding, Browser, Inbox, dan Profile |
| `/login` | Publik | Membuka Browser desktop dalam mode login |
| `/register` | Publik | Membuka Browser desktop dalam mode registrasi |
| `/game/privacy` | Login | Membuat atau melanjutkan sesi Privasi |
| `/game/privacy/:publicId` | Login | Membuka sesi Privasi aktif |
| `/game/phishing` | Login | Membuat atau melanjutkan sesi Phishing |
| `/game/phishing/:publicId` | Login | Membuka sesi Phishing |
| `/game/downloads` | Login | Membuat sesi Virus baru |
| `/game/downloads/:publicId` | Login | Membuka sesi Virus aktif |

## Struktur Folder

```text
Jejak-FE/
├── public/assets/       aset Desktop, Landing, game, font, dan maskot
├── src/
│   ├── components/     window desktop, taskbar, tutorial, loading, dan hasil
│   ├── data/           data pendukung frontend
│   ├── games/          implementasi Privasi, Phishing, dan Virus
│   ├── lib/            API, auth, progress, session, dan WebSocket client
│   ├── pages/          landing publik, desktop, dan adapter auth
│   ├── app.css
│   ├── app.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Persyaratan

- Node.js modern, disarankan Node.js 22 LTS.
- npm.
- Backend JEJAK dan PostgreSQL aktif.

## Menjalankan Secara Lokal

```bash
npm ci
copy .env.example .env
npm run dev
```

Linux/macOS:

```bash
npm ci
cp .env.example .env
npm run dev
```

Frontend tersedia di http://localhost:5173.

## Environment Variable

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` adalah origin backend untuk REST API, Better Auth, dan WebSocket. Nilai `VITE_*` terlihat di browser; jangan menyimpan secret di frontend.

Production:

```env
VITE_API_URL=https://api.jejaak.my.id
```

## Akun Demo / Login

JEJAK tidak memerlukan akun demo bersama. Juri dapat membuat akun melalui tombol **Buat Akun** atau route `/register` dengan:

- Nama minimal 2 karakter.
- Email valid.
- Kata sandi 8–128 karakter.

Progres permainan disimpan per akun. Backend harus mengizinkan origin frontend dan cookie credentialed.

## Validasi dan Build

```bash
npm run lint
npm run typecheck
npm run build
```

Output production berada di folder `dist/`.

## Deployment

1. Set `VITE_API_URL` ke backend HTTPS.
2. Jalankan `npm ci`.
3. Jalankan `npm run build`.
4. Sajikan folder `dist/` sebagai static site.
5. Aktifkan SPA fallback/rewrite seluruh route ke `index.html`.
6. Pastikan backend memasukkan origin frontend pada `FRONTEND_ORIGIN` atau `FRONTEND_ORIGINS`.

## Integrasi Backend

- REST dan auth menggunakan `credentials: include`.
- HTTP development diproxy melalui Vite dari `/api` ke `http://localhost:3000`.
- WebSocket otomatis mengubah `https` menjadi `wss`.
- Sesi game yang selesai atau ditinggalkan tidak dapat dibuka kembali.

## Catatan

- Inbox masih berupa placeholder.
- Belum ada test suite frontend otomatis.
- Seluruh aset visual aplikasi berada di `public/assets/`.
