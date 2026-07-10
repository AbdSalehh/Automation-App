/** Gaya garis koneksi React Flow yang tersedia di editor. */
export type ConnectionMode = "bezier" | "smoothstep" | "step" | "straight";

/** Preferensi editor per-pengguna untuk kanvas workflow. */
export interface UserSetting {
  fontSize: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showMinimap: boolean;
  showControls: boolean;
  connectionMode: ConnectionMode;
  animationSpeed: number;
}

/** Nilai default yang dipakai bila pengguna belum menyimpan setelan apa pun. */
export const DEFAULT_USER_SETTING: UserSetting = {
  fontSize: 14,
  showGrid: true,
  gridSize: 20,
  snapToGrid: false,
  showMinimap: false,
  showControls: true,
  connectionMode: "bezier",
  animationSpeed: 400,
};

export const CONNECTION_MODE_OPTIONS: {
  value: ConnectionMode;
  label: string;
}[] = [
  { value: "bezier", label: "Lengkung (Bezier)" },
  { value: "smoothstep", label: "Siku Halus (Smoothstep)" },
  { value: "step", label: "Siku (Step)" },
  { value: "straight", label: "Lurus (Straight)" },
];
