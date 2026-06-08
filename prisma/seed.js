/**
 * Database seed for the AutoFlow automation platform (JavaScript version).
 *
 * Creates an admin user and two sample workflows:
 *  1. Sample Workflow       — basic HTTP + Function demo
 *  2. Sheets → WhatsApp     — Google Sheets trigger → format → send via Fonnte
 *
 * Run with:
 *   node prisma/seed.js
 */

const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "admin@autoflow.local";

// ─── Workflow 1: Basic demo ───────────────────────────────────────────────
const SAMPLE_WORKFLOW_NODES = JSON.stringify([
  {
    id: "node-start",
    type: "workflowNode",
    position: { x: 100, y: 160 },
    data: { kind: "manual_trigger", label: "Start", config: {} },
  },
  {
    id: "node-http",
    type: "workflowNode",
    position: { x: 420, y: 160 },
    data: {
      kind: "http_request",
      label: "HTTP Request",
      config: {
        url: "https://jsonplaceholder.typicode.com/todos/1",
        method: "GET",
      },
    },
  },
  {
    id: "node-fn",
    type: "workflowNode",
    position: { x: 740, y: 160 },
    data: {
      kind: "function",
      label: "Transform",
      config: {
        code: "return { title: input.body.title, done: input.body.completed };",
      },
    },
  },
]);

const SAMPLE_WORKFLOW_EDGES = JSON.stringify([
  {
    id: "e-start-http",
    source: "node-start",
    target: "node-http",
    sourceHandle: null,
    targetHandle: null,
  },
  {
    id: "e-http-fn",
    source: "node-http",
    target: "node-fn",
    sourceHandle: null,
    targetHandle: null,
  },
]);

// ─── Workflow 2: Sheets → WhatsApp Reminder (dinamis) ─────────────────────
//
// Use case: kirim reminder WhatsApp ke pelanggan yang kolom "Pembayaran"-nya
// masih "Belum Dibayar", lalu tandai kolom "Status" jadi "Sudah Diingatkan".
//
// Node layout (left to right):
//   [Sheets Trigger] → [Read Sheet] → [Filter: Belum Dibayar]
//                                          → [Send WA Fonnte] → [Update Sheet]
//
// Kolom didaftarkan otomatis dari spreadsheet (live fetch), credential ID
// dikosongkan — user memilih sendiri di editor.

const SHEETS_WA_NODES = JSON.stringify([
  {
    id: "node-sheets-trigger",
    type: "workflowNode",
    position: { x: 40, y: 220 },
    data: {
      kind: "google_sheets_trigger",
      label: "Sheet Baru / Update",
      config: {
        spreadsheetId: "GANTI_DENGAN_SPREADSHEET_ID_ANDA",
        sheetName: "Sheet1",
        pollingIntervalSeconds: "60",
      },
      credentialId: "",
    },
  },
  {
    id: "node-read-sheet",
    type: "workflowNode",
    position: { x: 340, y: 220 },
    data: {
      kind: "google_sheets_read",
      label: "Baca Data Sheet",
      config: {
        spreadsheetId: "GANTI_DENGAN_SPREADSHEET_ID_ANDA",
        sheetName: "Sheet1",
        limit: "100",
        readColumns: [],
      },
      credentialId: "",
    },
  },
  {
    id: "node-filter",
    type: "workflowNode",
    position: { x: 640, y: 220 },
    data: {
      kind: "filter",
      label: "Hanya Belum Dibayar",
      config: {
        conditions: {
          match: "all",
          rules: [
            { field: "Pembayaran", operator: "equals", value: "Belum Dibayar" },
          ],
        },
      },
    },
  },
  {
    id: "node-send-wa",
    type: "workflowNode",
    position: { x: 940, y: 220 },
    data: {
      kind: "whatsapp_fonnte_send",
      label: "Kirim Reminder WA",
      config: {
        // Nomor diambil otomatis dari kolom "Nomor" pada tiap baris.
        targetField: "Nomor",
        message:
          "Halo {{Nama}} 👋\n\nPesanan *{{Pesanan}}* masih berstatus *{{Pembayaran}}*.\nMohon segera lakukan pembayaran ya. Terima kasih! 🙏",
        countryCode: "62",
        /**
         * Tunda 25 menit. Saat jatuh tempo, polling membaca ulang sheet dan
         * mengecek kondisi; jika Pembayaran sudah bukan "Belum Dibayar",
         * pengiriman dibatalkan otomatis. 0 = kirim langsung.
         */
        reminderDelayMinutes: "25",
      },
      credentialId: "",
    },
  },
  {
    id: "node-update-sheet",
    type: "workflowNode",
    position: { x: 1240, y: 220 },
    data: {
      kind: "google_sheets_update",
      label: "Tandai Sudah Diingatkan",
      config: {
        spreadsheetId: "GANTI_DENGAN_SPREADSHEET_ID_ANDA",
        sheetName: "Sheet1",
        /**
         * Tulis ke kolom berdasarkan nama header (bukan huruf). Sesuaikan nama
         * kolom dengan sheet Anda, mis. "Reminder".
         */
        writeTargets: [
          { column: "Reminder", value: "Sudah Diingatkan {{__waSentAt}}" },
        ],
      },
      credentialId: "",
    },
  },
]);

const SHEETS_WA_EDGES = JSON.stringify([
  {
    id: "e-trigger-read",
    source: "node-sheets-trigger",
    target: "node-read-sheet",
    sourceHandle: null,
    targetHandle: null,
  },
  {
    id: "e-read-filter",
    source: "node-read-sheet",
    target: "node-filter",
    sourceHandle: null,
    targetHandle: null,
  },
  {
    id: "e-filter-send",
    source: "node-filter",
    target: "node-send-wa",
    sourceHandle: null,
    targetHandle: null,
  },
  {
    id: "e-send-update",
    source: "node-send-wa",
    target: "node-update-sheet",
    sourceHandle: null,
    targetHandle: null,
  },
]);

// ─── Workflow 3: WA Reply (Whapi) → Kondisi → Catat ke Sheet ──────────────
//
// Use case: saat pelanggan membalas "sudah bayar", sistem:
//   1. Memeriksa apakah balasan mengandung kata kunci "sudah bayar"
//   2. Jika ya  → append baris (sender, message, waktu) ke Sheet "Balasan"
//   3. Jika tidak → kirim balasan WA otomatis meminta konfirmasi
//
// Webhook Whapi: daftarkan URL /api/webhooks/whapi di panel.whapi.cloud →
//   Channel → Webhooks → Message webhook.

const WA_REPLY_NODES = JSON.stringify([
  {
    id: "node-whapi-trigger",
    type: "workflowNode",
    position: { x: 40, y: 200 },
    data: {
      kind: "whatsapp_whapi_trigger",
      label: "Balas WA Masuk",
      config: {},
      credentialId: "",
    },
  },
  {
    id: "node-cek-pesan",
    type: "workflowNode",
    position: { x: 360, y: 200 },
    data: {
      kind: "condition",
      label: "Cek: Sudah Bayar?",
      config: {
        conditions: {
          match: "all",
          rules: [
            { field: "message", operator: "contains", value: "sudah bayar" },
          ],
        },
      },
    },
  },
  {
    id: "node-append-sheet",
    type: "workflowNode",
    position: { x: 680, y: 100 },
    data: {
      kind: "google_sheets_append",
      label: "Catat Balasan ke Sheet",
      config: {
        spreadsheetId: "GANTI_DENGAN_SPREADSHEET_ID_ANDA",
        sheetName: "Balasan",
        columns: "sender,message,receivedAt",
      },
      credentialId: "",
    },
  },
  {
    id: "node-balas-wa",
    type: "workflowNode",
    position: { x: 680, y: 340 },
    data: {
      kind: "whatsapp_whapi_send",
      label: "Balas: Belum Konfirmasi",
      config: {
        target: "{{sender}}",
        message:
          "Halo {{name}} 👋\n\nKami belum menerima konfirmasi pembayaran Anda.\nBalas dengan *sudah bayar* setelah melakukan pembayaran ya. Terima kasih 🙏",
      },
      credentialId: "",
    },
  },
]);

const WA_REPLY_EDGES = JSON.stringify([
  {
    id: "e-trigger-cek",
    source: "node-whapi-trigger",
    target: "node-cek-pesan",
    sourceHandle: null,
    targetHandle: null,
  },
  {
    id: "e-cek-append",
    source: "node-cek-pesan",
    target: "node-append-sheet",
    sourceHandle: "true",
    targetHandle: null,
    label: "true",
  },
  {
    id: "e-cek-balas",
    source: "node-cek-pesan",
    target: "node-balas-wa",
    sourceHandle: "false",
    targetHandle: null,
    label: "false",
  },
]);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Starting seed…");

  // --- Admin user -----------------------------------------------------------
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  let adminUser;

  if (existingAdmin) {
    console.log(`   ↳ Admin user already exists (${ADMIN_EMAIL}), skipping.`);
    adminUser = existingAdmin;
  } else {
    adminUser = await prisma.user.create({
      data: {
        name: "Admin AutoFlow",
        email: ADMIN_EMAIL,
        role: "admin",
        isActive: true,
        onboardingCompleted: true,
      },
    });

    console.log(
      `   ↳ Admin user created: ${adminUser.name} <${adminUser.email}>`,
    );
  }

  // --- Sample Workflow ------------------------------------------------------
  const existingWorkflow = await prisma.workflow.findFirst({
    where: { name: "Sample Workflow", ownerId: adminUser.id },
  });

  if (existingWorkflow) {
    console.log("   ↳ Sample workflow already exists, skipping.");
  } else {
    const workflow = await prisma.workflow.create({
      data: {
        name: "Sample Workflow",
        ownerId: adminUser.id,
        nodes: SAMPLE_WORKFLOW_NODES,
        edges: SAMPLE_WORKFLOW_EDGES,
        version: 1,
        isPublished: false,
      },
    });

    console.log(
      `   ↳ Sample workflow created: "${workflow.name}" (${workflow.id})`,
    );
  }

  // --- Sheets → WhatsApp Demo Workflow --------------------------------------
  const existingSheetsWa = await prisma.workflow.findFirst({
    where: { name: "Sheets → WhatsApp (Demo)", ownerId: adminUser.id },
  });

  if (existingSheetsWa) {
    console.log("   ↳ Sheets → WhatsApp workflow already exists, skipping.");
  } else {
    const sheetsWaWorkflow = await prisma.workflow.create({
      data: {
        name: "Sheets → WhatsApp (Demo)",
        ownerId: adminUser.id,
        nodes: SHEETS_WA_NODES,
        edges: SHEETS_WA_EDGES,
        version: 1,
        isPublished: false,
      },
    });

    console.log(
      `   ↳ Sheets → WhatsApp workflow created: "${sheetsWaWorkflow.name}" (${sheetsWaWorkflow.id})`,
    );
  }

  // --- WA Reply → Condition → Sheet Append Demo ----------------------------
  const existingWaReply = await prisma.workflow.findFirst({
    where: { name: "WA Balas → Catat ke Sheet (Demo)", ownerId: adminUser.id },
  });

  if (existingWaReply) {
    console.log("   ↳ WA Reply workflow already exists, skipping.");
  } else {
    const waReplyWorkflow = await prisma.workflow.create({
      data: {
        name: "WA Balas → Catat ke Sheet (Demo)",
        ownerId: adminUser.id,
        nodes: WA_REPLY_NODES,
        edges: WA_REPLY_EDGES,
        version: 1,
        isPublished: false,
      },
    });

    console.log(
      `   ↳ WA Reply workflow created: "${waReplyWorkflow.name}" (${waReplyWorkflow.id})`,
    );
  }

  console.log("✅  Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌  Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
