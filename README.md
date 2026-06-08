# AutoFlow — Workflow Automation (n8n-like MVP)

Platform automasi workflow berbasis node (mirip n8n) yang dibangun dengan
**Next.js (App Router)**, **React Flow**, **Prisma**, dan **NextAuth (Auth.js v5)**.
Backend memakai Next.js Route Handlers (tanpa server Express terpisah).

Spesifikasi lengkap ada di [`docs/n8n.md`](docs/n8n.md). Struktur kode mengikuti
**Feature-Sliced Design** sesuai [`docs/fsd.md`](docs/fsd.md).

## Arsitektur (FSD)

```
app/        → Next.js App Router (routing + API route handlers)
views/      → komposisi halaman dari widgets
widgets/    → blok UI besar (header, list, editor canvas, dll)
features/   → interaksi user (editor, manage credentials, auth)
entities/   → model bisnis: model + service + store (Zustand)
shared/     → kode reusable: ui, api, auth, lib, server (engine & connectors)
```

Aturan dependency: `app → views → widgets → features → entities → shared`.
Zustand hanya dipakai di `entities/*/store`. Import selalu lewat public API
(`index.ts`) tiap slice.

## Stack

- Next.js 16 + React 19, Tailwind CSS v4
- React Flow (`@xyflow/react`) untuk editor drag-and-drop
- Prisma ORM (default **SQLite** untuk dev; ganti ke Postgres/Supabase di produksi)
- NextAuth / Auth.js v5 dengan Google OAuth
- Zustand untuk state, Axios untuk HTTP (lewat `apiClient`)
- Redis (ioredis) untuk caching query

## Setup

1. Install dependency:

   ```bash
   npm install
   ```

2. Salin `.env.example` ke `.env` dan isi nilainya:

   ```bash
   cp .env.example .env
   ```

   - `AUTH_SECRET` — `npx auth secret` atau `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — dari Google Cloud Console
     (Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`)
   - `CREDENTIAL_ENCRYPTION_KEY` — `openssl rand -hex 32` (32 byte hex)
   - `REDIS_URL` — URL Redis (default `redis://127.0.0.1:6379`)

3. Buat database & generate Prisma client:

   ```bash
   npm run db:push
   ```

4. Jalankan dev server:

   ```bash
   npm run dev
   ```

   Buka http://localhost:3000 dan login dengan Google.

## Fitur

- **Auth**: Google OAuth via NextAuth, session di database, route group
  `(app)` dilindungi.
- **Editor workflow**: kanvas React Flow, palet node (Trigger / Action /
  Logic), konfigurasi per-node, pemilihan kredensial, simpan + versioning.
- **Kredensial**: CRUD konektor (WhatsApp, Telegram, Google OAuth/Service
  Account, HTTP). Disimpan terenkripsi (AES-256-GCM) per user. Tombol uji
  koneksi.
- **Engine eksekusi**: menjalankan workflow secara sinkron (in-process),
  menelusuri graf dari trigger, mencatat `Execution` / `NodeLog` / `Log`.
- **Executions**: riwayat eksekusi + log audit per node.
- **Generate case**: `GET /api/generate-case` → `JR-YYYY-XXXX`.

## API Endpoints

| Method           | Endpoint                     | Keterangan                                 |
| ---------------- | ---------------------------- | ------------------------------------------ |
| `*`              | `/api/auth/[...nextauth]`    | NextAuth                                   |
| `GET/POST`       | `/api/workflows`             | List / buat workflow                       |
| `GET/PUT/DELETE` | `/api/workflows/:id`         | Detail / update / hapus                    |
| `POST`           | `/api/workflows/:id/execute` | Jalankan workflow                          |
| `GET/POST`       | `/api/credentials`           | List / tambah kredensial                   |
| `DELETE`         | `/api/credentials/:id`       | Hapus kredensial                           |
| `POST`           | `/api/connectors/test`       | Uji koneksi konektor                       |
| `GET`            | `/api/executions`            | List eksekusi                              |
| `GET`            | `/api/executions/:id`        | Detail + log                               |
| `GET`            | `/api/logs`                  | Log runtime (filter `workflowId`, `level`) |
| `GET`            | `/api/generate-case`         | Nomor kasus baru                           |

## Caching (Redis)

Query yang sering dibaca di-cache di Redis lewat helper `shared/lib/cache.ts`:

- `cacheQuery(key, loader, ttl)` — baca dari cache, atau jalankan loader lalu
  simpan dengan TTL.
- `invalidateKeys(...)` / `invalidatePattern(...)` — hapus cache setelah mutasi.

Endpoint yang di-cache: list & detail workflow, list kredensial, list eksekusi.
Cache bersifat **best-effort** — jika Redis mati, request otomatis fallback ke
database tanpa error (lihat warning `[redis] connection error` saat Redis tidak
tersedia). Jalankan Redis lokal dengan Docker:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## Catatan & batasan MVP

- **SQLite** dipakai agar jalan tanpa konfigurasi. Untuk produksi, ubah
  `provider` di `prisma/schema.prisma` ke `postgresql`, set `DATABASE_URL` ke
  Supabase/Postgres, lalu `npm run db:push`. Kolom JSON/enum disimpan sebagai
  `String` agar portabel; bisa dikonversi ke tipe native Postgres bila perlu.
- **Engine** berjalan in-process di route handler (bukan worker + Redis/Bull
  seperti pada spec penuh). Untuk skala, pindahkan `runWorkflow` ke job queue.
- **Schedule/cron & webhook trigger** sudah ada sebagai tipe node, namun
  scheduler/endpoint webhook eksternal belum diaktifkan di MVP ini.
- Node **Google Sheets** disimulasikan (mencatat payload) karena butuh
  pertukaran token OAuth penuh.
