# Fluxera — Workflow Automation

Fluxera adalah platform automasi alur kerja (workflow) berbasis node secara visual. Platform ini dirancang agar pengguna dapat membuat, mengonfigurasi, dan menjalankan otomatisasi proses bisnis mereka sendiri (seperti membaca data dari Spreadsheet, mengevaluasi kondisi, dan mengirim pesan WhatsApp) melalui antarmuka _drag-and-drop_ yang intuitif.

Proyek ini dibangun secara full-stack menggunakan **Next.js (App Router)**, **React Flow**, **Prisma**, dan **NextAuth (Auth.js v5)**, sehingga tidak membutuhkan server backend terpisah; semua API dilayani melalui integrasi _Next.js Route Handlers_.

## Arsitektur Proyek (Feature-Sliced Design)

Untuk menjaga kode tetap bersih, mudah dikelola, dan dapat diskalakan, proyek ini menerapkan metodologi **Feature-Sliced Design (FSD)**. Kode dibagi berdasarkan fungsionalitas dan tanggung jawabnya ke dalam folder-folder berikut:

- **`app/` (Layer App)**  
  Berisi konfigurasi Next.js dasar seperti routing sistem (`layout.tsx`, `page.tsx`), inisialisasi gaya global, dan _API Route Handlers_. Layer ini murni sebagai entry-point dan tidak boleh mengandung banyak logika bisnis.

- **`views/` (Layer Views / Pages)**  
  Bertanggung jawab menyusun struktur suatu halaman secara utuh. View menggabungkan beberapa widget menjadi satu tampilan halaman responsif (misalnya halaman Editor Workflow atau halaman Daftar Kredensial).

- **`widgets/` (Layer Widgets)**  
  Komponen UI berskala besar dan independen yang berdiri sendiri (blok fungsional). Contohnya adalah `AppHeader`, daftar tabel, atau komponen kanvas editor utama. Widget menggabungkan fitur dan entitas menjadi sebuah entitas tampilan penuh.

- **`features/` (Layer Features)**  
  Menangani logika dan interaksi khusus yang difokuskan pada nilai bisnis langsung. Setiap folder dalam layer ini adalah satu fitur tunggal (seperti form pembuatan node, autentikasi login, dsb.) yang dapat dijalankan secara terpisah.

- **`entities/` (Layer Entities)**  
  Merupakan model bisnis inti dari aplikasi. Di sinilah tersimpan definisi tipe data, Zod schema (`model`), service pemanggil API eksternal (`api` atau `service`), dan manajemen state lokal (seperti `store` menggunakan Zustand) untuk entitas bisnis spesifik (contoh: `workflow`, `credential`, `execution`).

- **`shared/` (Layer Shared)**  
  Kumpulan utilitas dan komponen infrastruktur murni yang umum digunakan di seluruh sisi proyek dan tidak terikat pada satu fitur bisnis apa pun. Folder ini menyimpan komponen UI tombol, input (`shared/ui`), konfigurasi HTTP Axios (`shared/api`), utilitas _helper_, maupun modul _engine execution_ dasar di sisi server.

Aturan dependensi pada arsitektur FSD ini berjalan secara hierarkis dan satu arah (hanya boleh memanggil layer ke bawah):  
`app` → `views` → `widgets` → `features` → `entities` → `shared`

## Stack Teknologi

- **Frontend & Backend:** Next.js 16 + React 19 dengan Tailwind CSS v4.
- **Visual Node Editor:** React Flow (`@xyflow/react`) untuk interaksi kanvas drag-and-drop.
- **Database ORM:** Prisma ORM. Secara bawaan di lingkungan pengembangan menggunakan SQLite, yang disiapkan agar mudah dimigrasikan ke PostgreSQL/Supabase untuk _production_.
- **Autentikasi:** NextAuth / Auth.js v5 dengan integrasi Google OAuth.
- **State Management:** Zustand untuk UI state lokal yang reaktif.
- **HTTP Request:** Axios secara terpusat untuk interaksi client ke server.
- **Caching & Rate Limiting:** Redis (ioredis) untuk memori cache sementara yang performant terhadap _heavy query_.

## Setup & Instalasi

1. **Install dependency:**

   ```bash
   npm install
   ```

2. **Konfigurasi Environment:**  
   Salin `.env.example` menjadi `.env` lalu isikan nilainya:

   ```bash
   cp .env.example .env
   ```

   - `AUTH_SECRET` — Gunakan perintah `npx auth secret` atau `openssl rand -base64 32`.
   - `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET` — Diperoleh dari Google Cloud Console dengan Callback URI `http://localhost:3000/api/auth/callback/google`.
   - `CREDENTIAL_ENCRYPTION_KEY` — Kunci 32 byte bentuk heksadesimal (`openssl rand -hex 32`) untuk enkripsi konektor.
   - `REDIS_URL` — String koneksi server redis (opsional, default ke `redis://127.0.0.1:6379`).

3. **Sinkronisasi Database:**
   Terapkan skema bawaan database agar tabel-tabel terbuat:

   ```bash
   npm run db:push
   ```

4. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` melalui browser lalu login menggunakan kredensial Google.

## Fitur Utama

- **Workspaces & Editor Visual:** Membuat, menyusun, dan menyimpan logika _node_ (Trigger seperti _Cron_ vs Action seperti _WhatsApp Send_).
- **Manajemen Kredensial Terenkripsi:** Menyimpan kunci akses (WhatsApp Provider, Service Accounts, dll) dalam database setelah dienkripsi dengan standar AES-256-GCM tingkat sisi server, membuat data tidak berwujud teks jelas _(plaintext)_.
- **In-process Execution Engine:** Mesin _parser_ server-side graf untuk memproses alur logika yang dibangun _user_, meresolusi template tag `{{var}}`, serta melakukan transisi state.
- **History Eksekusi & Audit:** Merekam jejak eksekusi (_success / error_), dengan rincian balasan waktu tunggu tiap blok di dalam antarmuka _Executions_.
- **Cache Berbasis Redis:** Mengoptimalkan waktu pembacaan _read-heavy endpoint_ dalam manajemen memori di _Shared Server Caching_. (Catatan: cache bersifat _best-effort_; apabila Redis padam, request tetap dialihkan ke mode _fallback database_ secara otomatis).
