"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  /** Deret angka yang akan digambar sebagai garis. */
  data: number[];
  /** Warna garis (default oranye brand). */
  color?: string;
  /** Tinggi area chart dalam piksel. */
  height?: number;
}

/**
 * Line chart mungil tanpa sumbu/legend untuk menampilkan tren ringkas (mis.
 * cache hit rate, jumlah eksekusi). Dibangun di atas recharts agar konsisten
 * dengan chart lain di aplikasi.
 */
export function Sparkline({
  data,
  color = "#f97316",
  height = 48,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
      >
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
