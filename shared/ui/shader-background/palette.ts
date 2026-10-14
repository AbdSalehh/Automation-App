/**
 * Warna dalam rentang 0 sampai 1 untuk komponen merah, hijau, dan biru, sesuai
 * format yang diterima uniform shader.
 */
export type RgbColor = [number, number, number];

const BLACK: RgbColor = [0, 0, 0];
const WHITE: RgbColor = [1, 1, 1];

/**
 * Warna dasar cadangan bila warna CSS tidak dapat dibaca, misalnya nilai yang
 * tidak valid. Berupa biru netral agar latar tetap tampil wajar.
 */
const FALLBACK_COLOR: RgbColor = [0.106, 0.424, 0.659];

/**
 * Jumlah slot warna yang dibaca shader. Slot yang tidak terpakai diisi warna
 * terakhir agar tidak memunculkan warna hitam.
 */
const PALETTE_SLOT_COUNT = 8;

/**
 * Mengubah warna CSS apa pun menjadi RGB. Mendukung nilai seperti `#f97316`,
 * `oklch(...)`, maupun `var(--primary)`. Nilai diselesaikan lewat elemen
 * sementara supaya variabel CSS terbaca, lalu dikonversi ke piksel lewat
 * canvas karena format modern seperti `oklch` tidak bisa diurai manual.
 */
export function resolveCssColor(cssColor: string): RgbColor {
  const probeElement = document.createElement("span");

  probeElement.style.color = cssColor;

  if (!probeElement.style.color) {
    return FALLBACK_COLOR;
  }

  document.body.appendChild(probeElement);
  const computedColor = getComputedStyle(probeElement).color;
  probeElement.remove();

  const canvas = document.createElement("canvas");

  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context || !computedColor) {
    return FALLBACK_COLOR;
  }

  context.fillStyle = computedColor;
  context.fillRect(0, 0, 1, 1);

  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

  return [red / 255, green / 255, blue / 255];
}

/**
 * Mencampur dua warna. `amount` 0 menghasilkan `from`, 1 menghasilkan `to`.
 */
function mixColors(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

/**
 * Membentuk empat tingkat gradien dari satu warna dasar: bayangan gelap, warna
 * dasar yang sedikit digelapkan, cahaya terang, dan sorot hampir putih. Dengan
 * begitu seluruh latar mengikuti warna dasar yang diberikan.
 */
export function buildPalette(baseColor: RgbColor): RgbColor[] {
  const shadow = mixColors(baseColor, BLACK, 0.86);
  const deep = mixColors(baseColor, BLACK, 0.18);
  const glow = mixColors(baseColor, WHITE, 0.4);
  const highlight = mixColors(baseColor, WHITE, 0.88);

  return [
    shadow,
    deep,
    glow,
    ...Array.from({ length: PALETTE_SLOT_COUNT - 3 }, () => highlight),
  ];
}
