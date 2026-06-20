"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  /** Deret angka yang akan digambar sebagai area. */
  data: number[];
  /** Warna garis & gradient (default oranye brand). */
  color?: string;
  /** Tinggi area chart dalam piksel. */
  height?: number;
}

/**
 * Area chart mungil tanpa sumbu/legend untuk menampilkan tren ringkas (mis.
 * cache hit rate, jumlah eksekusi). Dibangun di atas recharts agar konsisten
 * dengan chart lain di aplikasi.
 */
export function Sparkline({
  data,
  color = "#f97316",
  height = 48,
}: SparklineProps) {
  const gradientId = useId();
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
