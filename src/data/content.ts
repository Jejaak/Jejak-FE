export type GameId = 'privacy' | 'phishing' | 'downloads';

export interface PhishingClue {
  id: string;
  label: string;
  text: string;
}

export interface PhishingEmail {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  greeting: string;
  body: string;
  action: string;
  suspicious: boolean;
  clues: PhishingClue[];
}

export interface DownloadFile {
  id: string;
  name: string;
  suspicious: boolean;
  asset: string;
}

export const phishingEmails: PhishingEmail[] = [
  {
    id: 'account-warning',
    sender: 'Keamanan Akun <aman@akun-verifikasi.click>',
    subject: 'AKUN DIBLOKIR DALAM 10 MENIT',
    preview: 'Verifikasi sekarang untuk mencegah pemblokiran.',
    greeting: 'Pengguna yang terhormat,',
    body: 'Kami menemukan masalah. Masukkan kata sandi melalui tautan berikut agar akun tidak diblokir.',
    action: 'http://akun-aman.verify-now.click',
    suspicious: true,
    clues: [
      { id: 'urgent', label: 'bahasa mendesak', text: 'AKUN DIBLOKIR DALAM 10 MENIT' },
      { id: 'domain', label: 'domain pengirim asing', text: 'aman@akun-verifikasi.click' },
      { id: 'link', label: 'tautan tidak resmi', text: 'akun-aman.verify-now.click' },
    ],
  },
  {
    id: 'school-verification',
    sender: 'Admin Sekolah <support-sekolah@gmail.example>',
    subject: 'Verifikasi akun sekolah sekarang',
    preview: 'Balas dengan kata sandi dan OTP agar akun tidak ditutup.',
    greeting: 'Yth. Pengguna,',
    body: 'Balas email ini dengan kata sandi lama dan kode OTP untuk mencegah penutupan akun hari ini.',
    action: 'Balas sebelum 30 menit.',
    suspicious: true,
    clues: [
      { id: 'school-domain', label: 'domain tidak resmi', text: 'support-sekolah@gmail.example' },
      { id: 'credentials', label: 'meminta kredensial', text: 'kata sandi lama dan kode OTP' },
      { id: 'school-urgent', label: 'ancaman mendesak', text: 'mencegah penutupan akun hari ini' },
    ],
  },
  {
    id: 'shared-document',
    sender: 'Calvin Wu <calvin@sekolah.id>',
    subject: 'Dokumen tugas kelompok dibagikan',
    preview: 'Calvin membagikan dokumen melalui layanan sekolah.',
    greeting: 'Halo Ari,',
    body: 'Dokumen tugas kelompok sudah dibagikan melalui layanan resmi sekolah.',
    action: 'Buka dokumen: dokumen.sekolah.id/tugas-kelompok',
    suspicious: false,
    clues: [
      { id: 'official-sender', label: 'pengirim terverifikasi', text: 'calvin@sekolah.id' },
      { id: 'official-link', label: 'tautan resmi', text: 'dokumen.sekolah.id/tugas-kelompok' },
    ],
  },
];

export const downloadFiles: DownloadFile[] = [
  { id: 'safe-01', name: 'tugas-sekolah.docx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-02', name: 'foto-keluarga.jpg', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-03', name: 'materi-matematika.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-04', name: 'jadwal-kelas.xlsx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-05', name: 'presentasi-kelompok.pptx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-06', name: 'catatan-harian.txt', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-07', name: 'musik-favorit.mp3', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-08', name: 'video-liburan.mp4', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-09', name: 'poster-lomba.png', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-10', name: 'resep-kue.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-11', name: 'laporan-praktikum.docx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-12', name: 'daftar-buku.xlsx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-13', name: 'desain-logo.png', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-14', name: 'rekaman-podcast.mp3', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-15', name: 'formulir-sekolah.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-16', name: 'kalender-acara.ics', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-17', name: 'panduan-belajar.epub', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-18', name: 'foto-profil.jpeg', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-19', name: 'arsip-tugas.zip', suspicious: false, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'safe-20', name: 'data-penelitian.csv', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-21', name: 'surat-izin-sekolah.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-22', name: 'rangkuman-sejarah.docx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-23', name: 'nilai-semester.xlsx', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-24', name: 'foto-kegiatan-kelas.png', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-25', name: 'rekaman-wawancara.wav', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-26', name: 'modul-bahasa-indonesia.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-27', name: 'diagram-organisasi.svg', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-28', name: 'daftar-hadir-kelas.csv', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-29', name: 'cerita-pendek.odt', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-30', name: 'video-presentasi.webm', suspicious: false, asset: '/assets/Game3/file.png' },
  { id: 'safe-31', name: 'template-anggaran.ods', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-32', name: 'peta-lokasi-sekolah.webp', suspicious: false, asset: '/assets/Shared/Game/FilePhoto.png' },
  { id: 'safe-33', name: 'notulen-rapat.rtf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-34', name: 'jadwal-ujian.pdf', suspicious: false, asset: '/assets/Shared/Game/FileText.png' },
  { id: 'safe-35', name: 'portofolio-seni.zip', suspicious: false, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-01', name: 'ROBUX-GRATIS.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-02', name: 'update-penting.scr', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-03', name: 'crack-game.bat', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-04', name: 'hadiah-menang.cmd', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-05', name: 'invoice-palsu.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-06', name: 'foto-rahasia.jpg.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-07', name: 'tugas-sekolah.docx.vbs', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-08', name: 'antivirus-gratis.msi', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-09', name: 'password-stealer.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-10', name: 'browser-update.com', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-11', name: 'aktivasi-windows.bat', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-12', name: 'bonus-skin.scr', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-13', name: 'cheat-game.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-14', name: 'dokumen-penting.js', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-15', name: 'scan-keamanan.ps1', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-16', name: 'undangan-pernikahan.apk', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-17', name: 'patch-premium.dmg', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-18', name: 'plugin-browser.xpi', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-19', name: 'laporan-keuangan.xlsm', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-20', name: 'paket-kurir.iso', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-21', name: 'rapor-semester.pdf.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-22', name: 'voucher-game-gratis.apk', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-23', name: 'foto-kelas.png.scr', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-24', name: 'driver-printer-gratis.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-25', name: 'jadwal-ujian.docx.vbs', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-26', name: 'claim-hadiah-sekarang.cmd', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-27', name: 'pemutar-video-premium.msi', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-28', name: 'kunci-jawaban.zip.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-29', name: 'undangan-reuni.pdf.js', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-30', name: 'optimasi-komputer.ps1', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-31', name: 'saldo-dompet-digital.bat', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-32', name: 'sertifikat-lomba.jpg.exe', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-33', name: 'codec-video-terbaru.pkg', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-34', name: 'pembersih-virus-portable.com', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
  { id: 'bad-35', name: 'dokumen-beasiswa.xlsm', suspicious: true, asset: '/assets/Shared/Game/FileZip.png' },
];
